import React, { useState, useEffect } from 'react';
import { ShipmentsProvider } from '../../context/ShipmentsContext';
import ShipmentsList from './ShipmentsList';
import ShipmentForm from './ShipmentForm';
import ShipmentMap from './map/ShipmentMap';
import ShipmentDetails from './ShipmentDetails';
import { useShipmentData } from '../../hooks/useShipmentData';
import { useTrackingData } from '../../hooks/useTrackingData';
import './Shipments.css';

const ShipmentsContainer = () => {
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  const { 
    shipments, 
    loading, 
    error, 
    createShipment, 
    deleteShipment 
  } = useShipmentData();
  
  const {
    trackingData,
    connectToTracking,
    disconnectTracking
  } = useTrackingData();

  useEffect(() => {
    if (selectedShipment) {
      connectToTracking(selectedShipment.id);
    }
    
    return () => {
      disconnectTracking();
    };
  }, [selectedShipment]);

  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
  };

  const handleShipmentSelect = (shipment) => {
    setSelectedShipment(shipment);
  };

  return (
    <ShipmentsProvider value={{ 
      shipments, 
      selectedShipment, 
      trackingData,
      loading, 
      error 
    }}>
      <div className="shipments-container">
        <div className="shipments-sidebar">
          <div className="action-buttons">
            <button onClick={toggleForm} className="create-shipment-btn">
              {isFormVisible ? 'Close Form' : 'Create Shipment'}
            </button>
          </div>
          
          {isFormVisible ? (
            <ShipmentForm 
              onSubmit={createShipment} 
              onClose={() => setIsFormVisible(false)}
            />
          ) : (
            <>
              <ShipmentsList 
                shipments={shipments}
                onSelect={handleShipmentSelect}
                onDelete={deleteShipment}
                selectedShipment={selectedShipment}
              />
              
              {selectedShipment && (
                <ShipmentDetails 
                  shipment={selectedShipment}
                  trackingData={trackingData}
                />
              )}
            </>
          )}
        </div>
        
        <div className="shipments-map-container">
          <ShipmentMap 
            shipments={shipments}
            selectedShipment={selectedShipment}
            trackingData={trackingData}
          />
        </div>
      </div>
    </ShipmentsProvider>
  );
};

export default ShipmentsContainer;
