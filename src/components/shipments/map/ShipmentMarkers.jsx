import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create custom markers for origin and destination
const createNumberedIcon = (number, isOrigin = false) => {
  return L.divIcon({
    className: `numbered-marker ${isOrigin ? 'origin-marker' : 'destination-marker'}`,
    html: `<div>${number}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

const ShipmentMarkers = ({ shipment }) => {
  if (!shipment) return null;

  // Create markers for origin and destination
  const originMarker = {
    position: [shipment.origin.latitude, shipment.origin.longitude],
    name: shipment.origin.name,
    isOrigin: true
  };

  const destinationMarker = {
    position: [shipment.destination.latitude, shipment.destination.longitude],
    name: shipment.destination.name,
    isOrigin: false
  };

  // Include any intermediate stops if they exist
  const stopMarkers = shipment.stops?.map((stop, index) => ({
    position: [stop.latitude, stop.longitude],
    name: stop.name,
    isOrigin: false,
    index: index + 1  // Start numbering from 1 after origin
  })) || [];

  // Combine all markers in sequence
  const allMarkers = [
    originMarker,
    ...stopMarkers,
    destinationMarker
  ];

  return (
    <>
      {allMarkers.map((marker, index) => (
        <Marker
          key={`marker-${index}`}
          position={marker.position}
          icon={createNumberedIcon(index, marker.isOrigin)}
        >
          <Popup>
            <strong>{marker.isOrigin ? 'Origin' : index === allMarkers.length - 1 ? 'Destination' : `Stop #${index}`}</strong>
            <br />
            {marker.name}
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default ShipmentMarkers;
