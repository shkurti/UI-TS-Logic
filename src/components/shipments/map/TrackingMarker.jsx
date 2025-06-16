import React, { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './TrackingMarker.css';

// Create a pulsating marker for real-time tracking
const createPulsatingMarker = () => {
  return L.divIcon({
    className: 'tracking-marker',
    html: `
      <div class="tracking-dot"></div>
      <div class="pulse-ring"></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const TrackingMarker = ({ position }) => {
  const markerRef = useRef(null);
  
  // Animate the marker when position changes
  useEffect(() => {
    if (markerRef.current && position) {
      const marker = markerRef.current;
      
      // Add a simple animation when marker moves
      const el = marker.getElement();
      if (el) {
        el.classList.add('marker-updated');
        setTimeout(() => {
          el.classList.remove('marker-updated');
        }, 500);
      }
    }
  }, [position]);
  
  if (!position) return null;
  
  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={createPulsatingMarker()}
      ref={markerRef}
    >
      <Popup>
        <div className="tracking-popup">
          <strong>Live Tracking</strong>
          <br />
          Lat: {position.lat.toFixed(6)}
          <br />
          Lng: {position.lng.toFixed(6)}
          <br />
          <span className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </Popup>
    </Marker>
  );
};

export default TrackingMarker;
