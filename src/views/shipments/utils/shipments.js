import L from 'leaflet'

// Geocode address with cache
const addressCache = {}
export const geocodeAddress = async (address) => {
  if (!address) return null
  if (addressCache[address]) return addressCache[address]
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'shipment-ui/1.0' } })
    const data = await res.json()
    if (data && data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      addressCache[address] = coords
      return coords
    }
  } catch (e) {}
  return null
}

export const getRegionName = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=5&addressdetails=1`
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'shipment-ui/1.0' }
    })
    const data = await response.json()
    if (data && data.address) {
      return data.address.state ||
        data.address.province ||
        data.address.region ||
        data.address.country ||
        'Unknown Region'
    }
  } catch (error) {}
  return 'Unknown Region'
}

export const createClusterIcon = (count, region) => {
  const size = Math.min(60, Math.max(30, 20 + (count * 3)))
  const color = count >= 10 ? '#d32f2f' :
    count >= 5 ? '#f57c00' :
      count >= 2 ? '#1976d2' : '#4caf50'
  return L.divIcon({
    className: 'shipment-cluster-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${count >= 100 ? '14px' : count >= 10 ? '16px' : '18px'};
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        font-family: Arial, sans-serif;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${count}
      </div>
      <style>
        .shipment-cluster-marker:hover div {
          transform: scale(1.1);
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

export const numberIcon = (number) =>
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

export const currentLocationIcon = L.divIcon({
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

export const hoverMarkerIcon = (sensorType) => {
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
