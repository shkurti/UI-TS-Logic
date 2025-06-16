import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const useShipmentData = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShipments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/shipments`);
      setShipments(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching shipments:', err);
      setError('Failed to load shipments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const createShipment = async (shipmentData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/shipments`, shipmentData);
      setShipments(prevShipments => [...prevShipments, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error creating shipment:', err);
      setError('Failed to create shipment. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteShipment = async (shipmentId) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/shipments/${shipmentId}`);
      setShipments(prevShipments => 
        prevShipments.filter(shipment => shipment.id !== shipmentId)
      );
    } catch (err) {
      console.error('Error deleting shipment:', err);
      setError('Failed to delete shipment. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    shipments,
    loading,
    error,
    fetchShipments,
    createShipment,
    deleteShipment
  };
};
