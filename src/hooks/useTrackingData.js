import { useState, useRef, useCallback } from 'react';
import { WEBSOCKET_URL } from '../config';

export const useTrackingData = () => {
  const [trackingData, setTrackingData] = useState({
    currentPosition: null,
    route: [],
    telemetry: {}
  });
  
  const socketRef = useRef(null);

  const connectToTracking = useCallback((shipmentId) => {
    // Disconnect any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Create new WebSocket connection
    socketRef.current = new WebSocket(`${WEBSOCKET_URL}/tracking/${shipmentId}`);
    
    socketRef.current.onopen = () => {
      console.log(`Connected to tracking for shipment ${shipmentId}`);
      // Reset tracking data when connecting to a new shipment
      setTrackingData({
        currentPosition: null,
        route: [],
        telemetry: {}
      });
    };
    
    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        setTrackingData(prevData => {
          // Add new position to route if it's a location update
          const newRoute = [...prevData.route];
          if (data.latitude && data.longitude) {
            newRoute.push([data.latitude, data.longitude]);
          }
          
          return {
            currentPosition: data.latitude && data.longitude 
              ? { lat: data.latitude, lng: data.longitude } 
              : prevData.currentPosition,
            route: newRoute,
            telemetry: {
              ...prevData.telemetry,
              ...data.telemetry
            }
          };
        });
      } catch (error) {
        console.error('Error parsing tracking data:', error);
      }
    };
    
    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    socketRef.current.onclose = () => {
      console.log('Tracking connection closed');
    };
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const disconnectTracking = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  return {
    trackingData,
    connectToTracking,
    disconnectTracking
  };
};
