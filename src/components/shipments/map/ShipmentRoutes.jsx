import React, { useEffect, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const ShipmentRoutes = ({ shipment, trackingData }) => {
  const map = useMap();
  const [routePoints, setRoutePoints] = useState([]);
  const [actualRoute, setActualRoute] = useState([]);

  // Calculate the planned route points
  useEffect(() => {
    if (!shipment) return;
    
    const points = [];
    
    // Start with origin
    points.push([shipment.origin.latitude, shipment.origin.longitude]);
    
    // Add any intermediate stops
    if (shipment.stops && shipment.stops.length > 0) {
      shipment.stops.forEach(stop => {
        points.push([stop.latitude, stop.longitude]);
      });
    }
    
    // End with destination
    points.push([shipment.destination.latitude, shipment.destination.longitude]);
    
    setRoutePoints(points);
  }, [shipment]);
  
  // Update the actual route from GPS tracking data
  useEffect(() => {
    if (trackingData && trackingData.route && trackingData.route.length > 0) {
      setActualRoute(trackingData.route);
    }
  }, [trackingData]);
  
  // Calculate the completed route segments
  const getCompletedRouteSegments = () => {
    if (!actualRoute.length || !routePoints.length) return [];
    
    // Find which segment of the planned route we're currently on
    // This is a simplified version - in a real app you would use a more sophisticated algorithm
    // to determine progress along the route
    const currentPosition = actualRoute[actualRoute.length - 1];
    let closestPointIndex = 0;
    let minDistance = Infinity;
    
    routePoints.forEach((point, index) => {
      if (index === 0) return; // Skip origin
      
      const distance = L.latLng(currentPosition).distanceTo(L.latLng(point));
      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = index;
      }
    });
    
    // Extract route segments up to the current position
    return routePoints.slice(0, closestPointIndex + 1);
  };
  
  return (
    <>
      {/* Planned route as dashed line */}
      <Polyline 
        positions={routePoints} 
        pathOptions={{ 
          color: 'gray', 
          weight: 3, 
          dashArray: '10, 10',
          opacity: 0.7
        }} 
      />
      
      {/* Actual GPS track */}
      {actualRoute.length > 0 && (
        <Polyline 
          positions={actualRoute} 
          pathOptions={{ 
            color: 'blue', 
            weight: 4,
            opacity: 0.8
          }} 
        />
      )}
      
      {/* Completed route segments */}
      {actualRoute.length > 0 && (
        <Polyline 
          positions={getCompletedRouteSegments()} 
          pathOptions={{ 
            color: 'green', 
            weight: 4,
            opacity: 0.8
          }} 
        />
      )}
    </>
  );
};

export default ShipmentRoutes;
