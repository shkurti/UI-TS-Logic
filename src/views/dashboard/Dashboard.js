import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
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
import { BsThermometerHalf, BsDroplet, BsBatteryHalf, BsSun } from 'react-icons/bs'
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

const Dashboard = () => {
  const [trackers, setTrackers] = useState([])
  const [selectedTracker, setSelectedTracker] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [route, setRoute] = useState([]) // Store the route for the selected tracker
  const [activeTab, setActiveTab] = useState('Details')
  const [activeSensor, setActiveSensor] = useState('Temperature') // Track the active sensor
  const [temperatureData, setTemperatureData] = useState([]) // Store temperature data for the chart

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
    setSelectedTracker(tracker) // Set the selected tracker
    fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/tracker_data/${tracker.tracker_id}`) // Fetch historical data
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (data && data.historical_data) {
          setHistoricalData(data.historical_data)

          // Correct key usage for geolocation data
          const geolocationData = data.historical_data
            .filter((record) => record.Lat !== undefined && record.Lng !== undefined)
            .map((record) => [parseFloat(record.Lat), parseFloat(record.Lng)])
          setRoute(geolocationData)

          // Correct key usage for temperature data
          const tempData = data.historical_data.map((record) => ({
            timestamp: record.DT, // Use DT for timestamp
            temperature: record.Temp, // Use Temp for temperature
          }))
          setTemperatureData(tempData)
        } else {
          console.warn('No historical data found for tracker:', tracker.tracker_id)
          setHistoricalData([])
          setRoute([])
          setTemperatureData([])
        }
      })
      .catch((error) => {
        console.error('Error fetching historical data:', error)
        setHistoricalData([])
        setRoute([])
        setTemperatureData([])
      })
  }

  const handleTabClick = (tab) => {
    setActiveTab(tab) // Set the active tab
  }

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
                    <div className="sensor-icons d-flex justify-content-around mb-4">
                      <BsThermometerHalf
                        size={30}
                        className={`sensor-icon ${activeSensor === 'Temperature' ? 'active' : ''}`}
                        onClick={() => setActiveSensor('Temperature')}
                      />
                      <BsDroplet
                        size={30}
                        className={`sensor-icon ${activeSensor === 'Humidity' ? 'active' : ''}`}
                        onClick={() => setActiveSensor('Humidity')}
                      />
                      <BsBatteryHalf
                        size={30}
                        className={`sensor-icon ${activeSensor === 'Battery' ? 'active' : ''}`}
                        onClick={() => setActiveSensor('Battery')}
                      />
                      <BsSun
                        size={30}
                        className={`sensor-icon ${activeSensor === 'Light' ? 'active' : ''}`}
                        onClick={() => setActiveSensor('Light')}
                      />
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
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="temperature" stroke="#8884d8" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    {activeSensor === 'Humidity' && (
                      <p>Humidity chart visualization goes here...</p>
                    )}
                    {activeSensor === 'Battery' && (
                      <p>Battery chart visualization goes here...</p>
                    )}
                    {activeSensor === 'Light' && (
                      <p>Light chart visualization goes here...</p>
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
