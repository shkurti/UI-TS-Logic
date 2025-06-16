import L from 'leaflet'

// Standard marker icon
export const standardIcon = window.L
  ? window.L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    })
  : null

// Number marker icon
export const createNumberIcon = (number) =>
  L.divIcon({
    className: 'number-marker',
    html: `<div style="
      background: #1976d2;
      color: #fff;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      border: 3px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      font-family: Arial, sans-serif;
    ">${number}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })

// Current location marker
export const createCurrentLocationIcon = () =>
  L.divIcon({
    className: 'current-location-marker',
    html: `<div style="
      background: #ff4444;
      color: #fff;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      border: 3px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      animation: pulse 2s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    </style>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  })

// Hover marker icon for sensor data
export const createHoverMarkerIcon = (sensorType) => {
  const colors = {
    'Temperature': '#ff6b6b',
    'Humidity': '#4ecdc4',
    'Battery': '#45b7d1',
    'Speed': '#96ceb4'
  }
  
  const icons = {
    'Temperature': '🌡️',
    'Humidity': '💧',
    'Battery': '🔋',
    'Speed': '⚡'
  }
  
  return L.divIcon({
    className: 'hover-sensor-marker',
    html: `<div style="
      background: ${colors[sensorType] || '#666'};
      color: #fff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      animation: bounce 0.6s ease-in-out;
    ">${icons[sensorType] || '📍'}</div>
    <style>
      @keyframes bounce {
        0%, 20%, 60%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        80% { transform: translateY(-5px); }
      }
    </style>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}
