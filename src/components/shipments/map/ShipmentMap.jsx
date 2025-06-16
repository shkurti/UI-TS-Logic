import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ShipmentMarkers from './ShipmentMarkers';
import ShipmentClusters from './ShipmentClusters';
import ShipmentRoutes from './ShipmentRoutes';
import TrackingMarker from './TrackingMarker';
import './ShipmentMap.css';

// This is a helper component to adjust the map view when props change
const MapViewController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const ShipmentMap = ({ shipments, selectedShipment, trackingData }) => {
  const mapRef = useRef(null);
  
  // Determine map center based on selected shipment or tracking data
  const getMapCenter = () => {
    if (trackingData?.currentPosition) {
      return [trackingData.currentPosition.lat, trackingData.currentPosition.lng];
    }
    
    if (selectedShipment) {
      return [selectedShipment.origin.latitude, selectedShipment.origin.longitude];
    }
    
    // Default center if no shipment selected
    return [40, -95]; // Center of US
  };
  
  const getZoomLevel = () => {
    return selectedShipment ? 10 : 4;
  };
  
  return (
    <MapContainer
      center={getMapCenter()}
      zoom={getZoomLevel()}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <MapViewController 
        center={getMapCenter()}
        zoom={getZoomLevel()}
      />
      
      {selectedShipment ? (
        // Display selected shipment details
        <>
          <ShipmentMarkers shipment={selectedShipment} />
          <ShipmentRoutes 
            shipment={selectedShipment} 
            trackingData={trackingData} 
          />
          {trackingData?.currentPosition && (
            <TrackingMarker 
              position={trackingData.currentPosition} 
            />
          )}
        </>
      ) : (
        // Display all shipments clustered
        <ShipmentClusters shipments={shipments} />
      )}
    </MapContainer>
  );
};

export default ShipmentMap;
