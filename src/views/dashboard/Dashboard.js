import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import './Dashboard.css' // Import custom styles for the dashboard
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCardTitle,
  CCol,
  CNav,
  CNavItem,
  CNavLink,
  CRow,
  CTabContent,
  CTabPane,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { BsThermometerHalf, BsDroplet, BsBatteryHalf, BsSpeedometer2, BsSun } from 'react-icons/bs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Define a custom marker icon
const customIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Component to adjust the map view to fit the route
function FitBounds({ route }) {
  const map = useMap()
  useEffect(() => {
    if (route.length > 0) {
      const bounds = route.map(([lat, lng]) => [lat, lng]) // Convert route to bounds
      map.fitBounds(bounds) // Adjust the map view to fit the route
    }
  }, [route, map])
  return null
}

const deduplicateRoute = (route) => {
  const seen = new Set();
  return route.filter(([lat, lng]) => {
    const key = `${lat},${lng}`;
    if (seen.has(key)) {
      return false; // Skip duplicate points
    }
    seen.add(key);
    return true;
  });
};

const Dashboard = () => {
  const [trackers, setTrackers] = useState([])
  const [selectedTracker, setSelectedTracker] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [route, setRoute] = useState([]) // Store the route for the selected tracker
  const [activeTab, setActiveTab] = useState('Details')
  const [activeSensor, setActiveSensor] = useState('Temperature') // Track the active sensor
  const [temperatureData, setTemperatureData] = useState([]) // Store temperature data for the chart
  const [humidityData, setHumidityData] = useState([]) // Store humidity data for the chart
  const [batteryData, setBatteryData] = useState([]) // Store battery data for the chart
  const [speedData, setSpeedData] = useState([]) // Store speed data for the chart

  useEffect(() => {
    // Fetch all registered trackers
    fetch('https://backend-ts-68222fd8cfc0.herokuapp.com/trackers')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => setTrackers(data))
      .catch((error) => console.error('Error fetching trackers:', error))
  }, [])

  const handleTrackerSelect = (tracker) => {
    setSelectedTracker(tracker); // Set the selected tracker
    fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/tracker_data/${tracker.tracker_id}`) // Fetch historical data
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Tracker Data Received:", data); // Debug log to verify data
        if (data && data.data && data.data.length > 0) {
          const geolocationData = data.data
            .filter(record => record.latitude !== undefined && record.longitude !== undefined)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Ensure order
            .map(record => [parseFloat(record.latitude), parseFloat(record.longitude)]);
          setRoute(deduplicateRoute(geolocationData)); // Update the route for the map

          // Extract temperature data for the chart
          const tempData = data.data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            temperature: record.temperature !== undefined ? parseFloat(record.temperature) : null,
          }));
          setTemperatureData(tempData);

          // Extract humidity data for the chart
          const humData = data.data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            humidity: record.humidity !== undefined ? parseFloat(record.humidity) : null,
          }));
          setHumidityData(humData);

          // Extract battery data for the chart
          const battData = data.data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            battery: record.battery !== undefined ? parseFloat(record.battery) : null,
          }));
          setBatteryData(battData);

          // Extract speed data for the chart
          const spdData = data.data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            speed: record.speed !== undefined ? parseFloat(record.speed) : null,
          }));
          setSpeedData(spdData);
        } else {
          console.warn(`No historical data found for tracker: ${tracker.tracker_id}`);
          setRoute([]);
          setTemperatureData([]);
          setHumidityData([]);
          setBatteryData([]);
          setSpeedData([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching tracker data:', error);
        setRoute([]);
        setTemperatureData([]);
        setHumidityData([]);
        setBatteryData([]);
        setSpeedData([]);
      });
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab) // Set the active tab
  }

  useEffect(() => {
    if (selectedTracker) {
      // WebSocket for real-time updates
      const ws = new WebSocket('wss://backend-ts-68222fd8cfc0.herokuapp.com/ws');
      ws.onopen = () => console.log('WebSocket connection established');
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message); // Debug log

        if (message.operationType === 'insert' && String(message.tracker_id) === String(selectedTracker.tracker_id)) {
          const { new_record, geolocation } = message;

          // Sanitize incoming data
          const lat = parseFloat(geolocation?.Lat);
          const lng = parseFloat(geolocation?.Lng);

          if (!isNaN(lat) && !isNaN(lng)) {
            setRoute((prevRoute) => {
              const lastPoint = prevRoute[prevRoute.length - 1];
              const newPoint = [lat, lng];

              // Debug logs
              console.log('Current Route:', prevRoute);
              console.log('New Point:', newPoint);

              // Avoid adding duplicate points and clean the route
              const updatedRoute = !lastPoint || lastPoint[0] !== lat || lastPoint[1] !== lng
                ? [...prevRoute, newPoint]
                : prevRoute;

              return deduplicateRoute(updatedRoute); // Deduplicate the route
            });
          } else {
            console.warn('Invalid geolocation data received:', geolocation);
          }

          // Update the chart data
          if (new_record) {
            if (new_record.timestamp && new_record.temperature !== undefined) {
              setTemperatureData((prevData) => {
                if (!prevData.some((data) => data.timestamp === new_record.timestamp)) {
                  return [
                    ...prevData,
                    { timestamp: new_record.timestamp, temperature: parseFloat(new_record.temperature) },
                  ];
                }
                return prevData; // Avoid duplicates
              });
            }
            if (new_record.timestamp && new_record.humidity !== undefined) {
              setHumidityData((prevData) => {
                if (!prevData.some((data) => data.timestamp === new_record.timestamp)) {
                  return [
                    ...prevData,
                    { timestamp: new_record.timestamp, humidity: parseFloat(new_record.humidity) },
                  ];
                }
                return prevData; // Avoid duplicates
              });
            }
            if (new_record.timestamp && new_record.battery !== undefined) {
              setBatteryData((prevData) => {
                if (!prevData.some((data) => data.timestamp === new_record.timestamp)) {
                  return [
                    ...prevData,
                    { timestamp: new_record.timestamp, battery: parseFloat(new_record.battery) },
                  ];
                }
                return prevData; // Avoid duplicates
              });
            }
            if (new_record.timestamp && new_record.speed !== undefined) {
              setSpeedData((prevData) => {
                if (!prevData.some((data) => data.timestamp === new_record.timestamp)) {
                  return [
                    ...prevData,
                    { timestamp: new_record.timestamp, speed: parseFloat(new_record.speed) },
                  ];
                }
                return prevData; // Avoid duplicates
              });
            }
          }
        }
      };
      ws.onerror = (error) => console.error('WebSocket error:', error);
      ws.onclose = () => console.log('WebSocket connection closed');

      return () => ws.close();
    }
  }, [selectedTracker]);

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardBody>
              <MapContainer
                center={[42.798939, -74.658409]}
                zoom={13}
                style={{ height: '500px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <FitBounds route={route} /> {/* Adjust the map view to fit the route */}
                {route.length > 1 ? (
                  <>
                    <Polyline positions={route} color="blue" />
                    <Marker position={route[route.length - 1]} icon={customIcon}>
                      <Popup>Current Location</Popup>
                    </Marker>
                  </>
                ) : route.length === 1 ? (
                  <Marker position={route[0]} icon={customIcon}>
                    <Popup>Only one location available</Popup>
                  </Marker>
                ) : null}
              </MapContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CRow>
        <CCol xs={12} lg={4}>
          <CCard className="mb-4">
            <CCardHeader>
              <CCardTitle>Registered Trackers</CCardTitle>
            </CCardHeader>
            <CCardBody>
              <div className="tracker-list-scrollable">
                {trackers.map((tracker) => (
                  <div
                    key={tracker.tracker_id}
                    className={`tracker-item ${
                      selectedTracker?.tracker_id === tracker.tracker_id ? 'selected' : ''
                    }`}
                    onClick={() => handleTrackerSelect(tracker)}
                    style={{
                      cursor: 'pointer',
                      padding: '10px',
                      backgroundColor:
                        selectedTracker?.tracker_id === tracker.tracker_id ? '#f5f5f5' : '',
                    }}
                  >
                    <p>{tracker.tracker_name}</p>
                  </div>
                ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} lg={8}>
          <CCard className="mb-4">
            <CCardHeader>
              <CNav variant="tabs" role="tablist">
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'Details'}
                    onClick={() => handleTabClick('Details')}
                  >
                    Details
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'Sensors'}
                    onClick={() => handleTabClick('Sensors')}
                  >
                    Sensors
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'Alerts'}
                    onClick={() => handleTabClick('Alerts')}
                  >
                    Alerts
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'Reports'}
                    onClick={() => handleTabClick('Reports')}
                  >
                    Reports
                  </CNavLink>
                </CNavItem>
              </CNav>
            </CCardHeader>
            <CCardBody>
              <CTabContent>
                {activeTab === 'Details' && selectedTracker && (
                  <CTabPane visible>
                    <p>
                      <strong>Selected Tracker:</strong> {selectedTracker.tracker_name}
                    </p>
                    <p>
                      <strong>Tracker ID:</strong> {selectedTracker.tracker_id}
                    </p>
                    <p>
                      <strong>Device Type:</strong> {selectedTracker.device_type}
                    </p>
                    <p>
                      <strong>Model:</strong> {selectedTracker.model_number}
                    </p>
                  </CTabPane>
                )}
                {activeTab === 'Sensors' && (
                  <CTabPane visible>
                    <div className="sensor-icons d-flex justify-content-center mb-4" style={{ gap: 16 }}>
                      <div
                        className={`sensor-icon-wrapper${activeSensor === 'Temperature' ? ' bg-primary text-white' : ''}`}
                        onClick={() => setActiveSensor('Temperature')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: activeSensor === 'Temperature' ? '#0d6efd' : 'transparent',
                          color: activeSensor === 'Temperature' ? '#fff' : undefined,
                          transition: 'background 0.2s, color 0.2s',
                          minWidth: 70
                        }}
                      >
                        <BsThermometerHalf size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Temperature</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper${activeSensor === 'Humidity' ? ' bg-primary text-white' : ''}`}
                        onClick={() => setActiveSensor('Humidity')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: activeSensor === 'Humidity' ? '#0d6efd' : 'transparent',
                          color: activeSensor === 'Humidity' ? '#fff' : undefined,
                          transition: 'background 0.2s, color 0.2s',
                          minWidth: 70
                        }}
                      >
                        <BsDroplet size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Humidity</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper${activeSensor === 'Battery' ? ' bg-primary text-white' : ''}`}
                        onClick={() => setActiveSensor('Battery')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: activeSensor === 'Battery' ? '#0d6efd' : 'transparent',
                          color: activeSensor === 'Battery' ? '#fff' : undefined,
                          transition: 'background 0.2s, color 0.2s',
                          minWidth: 70
                        }}
                      >
                        <BsBatteryHalf size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Battery</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper${activeSensor === 'Light' ? ' bg-primary text-white' : ''}`}
                        onClick={() => setActiveSensor('Light')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: activeSensor === 'Light' ? '#0d6efd' : 'transparent',
                          color: activeSensor === 'Light' ? '#fff' : undefined,
                          transition: 'background 0.2s, color 0.2s',
                          minWidth: 70
                        }}
                      >
                        <BsSun size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Light</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper${activeSensor === 'Speed' ? ' bg-primary text-white' : ''}`}
                        onClick={() => setActiveSensor('Speed')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: activeSensor === 'Speed' ? '#0d6efd' : 'transparent',
                          color: activeSensor === 'Speed' ? '#fff' : undefined,
                          transition: 'background 0.2s, color 0.2s',
                          minWidth: 70
                        }}
                      >
                        <BsSpeedometer2 size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Speed</span>
                      </div>
                    </div>
                    {activeSensor === 'Temperature' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={temperatureData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={false} /> {/* Hide timestamps on X-axis */}
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) => [
                              `${name === 'temperature' ? 'Temperature' : ''}: ${value}°C`,
                              null,
                            ]}
                            labelFormatter={(label) => `Timestamp: ${label}`}
                          />
                          <Line type="monotone" dataKey="temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    {activeSensor === 'Humidity' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={humidityData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={false} /> {/* Hide timestamps on X-axis */}
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) => [
                              `${name === 'humidity' ? 'Humidity' : ''}: ${value}%`,
                              null,
                            ]}
                            labelFormatter={(label) => `Timestamp: ${label}`}
                          />
                          <Line type="monotone" dataKey="humidity" stroke="#82ca9d" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    {activeSensor === 'Battery' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={batteryData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={false} /> {/* Hide timestamps on X-axis */}
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) => [
                              `${name === 'battery' ? 'Battery Level' : ''}: ${value}%`,
                              null,
                            ]}
                            labelFormatter={(label) => `Timestamp: ${label}`}
                          />
                          <Line type="monotone" dataKey="battery" stroke="#ffc658" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    {activeSensor === 'Light' && (
                      <p>Light chart visualization goes here...</p>
                    )}
                    {activeSensor === 'Speed' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={speedData}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={false} /> {/* Hide timestamps on X-axis */}
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) => [
                              `${name === 'speed' ? 'Speed' : ''}: ${value} km/h`,
                              null,
                            ]}
                            labelFormatter={(label) => `Timestamp: ${label}`}
                          />
                          <Line type="monotone" dataKey="speed" stroke="#ff7300" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CTabPane>
                )}
                {activeTab === 'Alerts' && <CTabPane visible>Alerts content</CTabPane>}
                {activeTab === 'Reports' && <CTabPane visible>Reports content</CTabPane>}
              </CTabContent>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard