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
      const bounds = route.map(([lat, lng]) => [lat, lng])
      map.fitBounds(bounds)
    }
  }, [route, map])
  return null
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Details')
  const [selectedTracker, setSelectedTracker] = useState(null)
  const [route, setRoute] = useState([])
  const [trackers, setTrackers] = useState([])
  const [historicalData, setHistoricalData] = useState([])

  useEffect(() => {
    // Fetch initial list of trackers
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

  useEffect(() => {
    if (selectedTracker) {
      // Fetch historical geolocation and chart data for the selected tracker
      fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/tracker_data/${selectedTracker.id}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })
        .then((data) => {
          if (data && data.historical_data) {
            const geolocationData = data.historical_data
              .filter((record) => record.latitude !== 'N/A' && record.longitude !== 'N/A')
              .map((record) => [parseFloat(record.latitude), parseFloat(record.longitude)])
            const chartData = data.historical_data.map((record) => ({
              timestamp: record.timestamp,
              temperature: record.temperature,
              battery: record.battery,
            }))
            setRoute(geolocationData)
            setHistoricalData(chartData)
          } else {
            setRoute([])
            setHistoricalData([])
          }
        })
        .catch((error) => console.error('Error fetching tracker data:', error))
    }
  }, [selectedTracker])

  const handleTrackerClick = (tracker) => {
    setSelectedTracker(tracker)
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
                <FitBounds route={route} />
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
        <CCol xs={12} lg={8}>
          <CCard className="mb-4">
            <CCardHeader>
              <CNav variant="tabs" role="tablist" className="d-flex">
                <CNavItem className="me-2">
                  <CNavLink
                    active={activeTab === 'Details'}
                    onClick={() => setActiveTab('Details')}
                  >
                    Details
                  </CNavLink>
                </CNavItem>
                <CNavItem className="me-2">
                  <CNavLink
                    active={activeTab === 'Sensors'}
                    onClick={() => setActiveTab('Sensors')}
                  >
                    Sensors
                  </CNavLink>
                </CNavItem>
                <CNavItem className="me-2">
                  <CNavLink
                    active={activeTab === 'Alerts'}
                    onClick={() => setActiveTab('Alerts')}
                  >
                    Alerts
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'Reports'}
                    onClick={() => setActiveTab('Reports')}
                  >
                    Reports
                  </CNavLink>
                </CNavItem>
              </CNav>
            </CCardHeader>
            <CCardBody>
              <CTabContent>
                <CTabPane visible={activeTab === 'Details'}>
                  <p>Details content goes here...</p>
                </CTabPane>
                <CTabPane visible={activeTab === 'Sensors'}>
                  <p>Sensors content goes here...</p>
                </CTabPane>
                <CTabPane visible={activeTab === 'Alerts'}>
                  <p>Alerts content goes here...</p>
                </CTabPane>
                <CTabPane visible={activeTab === 'Reports'}>
                  <p>Reports content goes here...</p>
                </CTabPane>
              </CTabContent>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} lg={4}>
          <CCard className="mb-4">
            <CCardHeader>
              <CCardTitle>Registered Trackers</CCardTitle>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Tracker ID</CTableHeaderCell>
                    <CTableHeaderCell>Tracker Name</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {trackers.map((tracker, index) => (
                    <CTableRow
                      key={index}
                      onClick={() => handleTrackerClick(tracker)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor:
                          selectedTracker?.id === tracker.id ? '#f5f5f5' : '',
                      }}
                    >
                      <CTableDataCell>{tracker.id}</CTableDataCell>
                      <CTableDataCell>{tracker.name}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
