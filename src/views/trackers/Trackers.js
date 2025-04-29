import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormSelect,
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

// Component to move the map to the selected tracker's location
function MapMover({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom())
    }
  }, [position, map])
  return null
}

const Trackers = () => {
  const [trackers, setTrackers] = useState([])
  const [selectedTracker, setSelectedTracker] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [newTracker, setNewTracker] = useState({
    tracker_name: '',
    tracker_id: '',
    device_type: '',
    model_number: '',
  })
  const [route, setRoute] = useState([]); // Store the route for the selected tracker

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

    // WebSocket for real-time updates
    const ws = new WebSocket('wss://backend-ts-68222fd8cfc0.herokuapp.com/ws')
    ws.onopen = () => console.log('WebSocket connection established')
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.operationType === 'insert') {
        setTrackers((prevTrackers) => {
          const trackerExists = prevTrackers.some(
            (tracker) => tracker.tracker_id === message.data.tracker_id,
          )
          if (!trackerExists) {
            return [...prevTrackers, message.data]
          }
          return prevTrackers
        })
      }
    }
    ws.onerror = (error) => console.error('WebSocket error:', error)
    ws.onclose = () => console.log('WebSocket connection closed')

    return () => ws.close()
  }, [])

  const handleRegisterTracker = () => {
    setShowModal(true)
  }

  const handleCancel = () => {
    setShowModal(false)
    setNewTracker({
      tracker_name: '',
      tracker_id: '',
      device_type: '',
      model_number: '',
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewTracker((prevState) => ({ ...prevState, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('https://backend-ts-68222fd8cfc0.herokuapp.com/register_tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTracker),
      })

      if (response.ok) {
        const result = await response.json()
        setTrackers((prevTrackers) => {
          const trackerExists = prevTrackers.some(
            (tracker) => tracker.tracker_id === result.tracker.tracker_id,
          )
          if (!trackerExists) {
            return [...prevTrackers, result.tracker]
          }
          return prevTrackers
        })
        setShowModal(false)
        setNewTracker({
          tracker_name: '',
          tracker_id: '',
          device_type: '',
          model_number: '',
        })
      } else {
        const error = await response.json()
        console.error('Failed to register tracker:', error.message)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedTracker) {
      alert('Please select a tracker to delete.')
      return
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete tracker "${selectedTracker.tracker_name}"?`,
    )
    if (!confirmDelete) return

    try {
      const response = await fetch(
        `https://backend-ts-68222fd8cfc0.herokuapp.com/delete_tracker/${selectedTracker.tracker_id}`,
        {
          method: 'DELETE',
        },
      )

      if (response.ok) {
        alert('Tracker deleted successfully.')
        setTrackers((prevTrackers) =>
          prevTrackers.filter((tracker) => tracker.tracker_id !== selectedTracker.tracker_id),
        )
        setSelectedTracker(null)
      } else {
        const error = await response.json()
        alert(`Failed to delete tracker: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error deleting tracker:', error)
      alert('An error occurred while deleting the tracker.')
    }
  }

  const handleTrackerSelect = (tracker) => {
    setSelectedTracker(tracker)

    // Fetch historical data for the selected tracker
    fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/tracker_data/${tracker.tracker_id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.historical_data) {
          const geolocationData = data.historical_data
            .filter((record) => record.latitude && record.longitude)
            .map((record) => [parseFloat(record.latitude), parseFloat(record.longitude)]);
          setRoute(geolocationData); // Update the route for the map

          // Update tracker details
          setSelectedTracker((prev) => ({
            ...prev,
            batteryLevel: data.historical_data.slice(-1)[0]?.battery || prev.batteryLevel,
            lastConnected: data.historical_data.slice(-1)[0]?.timestamp || prev.lastConnected,
            location: geolocationData.length > 0
              ? `${geolocationData[geolocationData.length - 1][0]}, ${geolocationData[geolocationData.length - 1][1]}`
              : prev.location,
          }));
        } else {
          console.warn('No historical data found for tracker:', tracker.tracker_id);
          setRoute([]); // Clear the route if no data is found
        }
      })
      .catch((error) => console.error('Error fetching historical data:', error));
  };

  useEffect(() => {
    if (selectedTracker) {
      // WebSocket for real-time updates
      const ws = new WebSocket('wss://backend-ts-68222fd8cfc0.herokuapp.com/ws')
      ws.onopen = () => console.log('WebSocket connection established')
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log('WebSocket message received:', message); // Debug log

        if (message.operationType === 'insert' && message.data.tracker_id === selectedTracker.tracker_id) {
          const { Lat, Lng } = message.geolocation || {};
          const newRecord = message.data.historical_data?.slice(-1)[0]; // Get the latest record

          // Update the map route
          if (Lat && Lng) {
            setRoute((prevRoute) => [...prevRoute, [parseFloat(Lat), parseFloat(Lng)]]);
          }

          // Update tracker details
          setSelectedTracker((prev) => ({
            ...prev,
            batteryLevel: newRecord?.battery || prev.batteryLevel,
            lastConnected: newRecord?.timestamp || prev.lastConnected,
            location: Lat && Lng ? `${Lat}, ${Lng}` : prev.location,
          }));
        }
      }
      ws.onerror = (error) => console.error('WebSocket error:', error)
      ws.onclose = () => console.log('WebSocket connection closed')

      return () => ws.close()
    }
  }, [selectedTracker])

  return (
    <>
      <CRow>
        <CCol xs={12} lg={6}>
          <CCard>
            <CCardHeader>
              <CButton color="primary" className="me-2" onClick={handleRegisterTracker}>
                Register New Tracker
              </CButton>
              <CButton
                color="danger"
                onClick={handleDeleteSelected}
                disabled={!selectedTracker}
              >
                Delete Selected Tracker
              </CButton>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Tracker ID</CTableHeaderCell>
                    <CTableHeaderCell>Battery Level</CTableHeaderCell>
                    <CTableHeaderCell>Last Connected</CTableHeaderCell>
                    <CTableHeaderCell>Location</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {trackers.map((tracker) => (
                    <CTableRow
                      key={tracker.tracker_id}
                      onClick={() => handleTrackerSelect(tracker)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor:
                          selectedTracker?.tracker_id === tracker.tracker_id ? '#f5f5f5' : '',
                      }}
                    >
                      <CTableDataCell>{tracker.tracker_id}</CTableDataCell>
                      <CTableDataCell>{tracker.batteryLevel}%</CTableDataCell>
                      <CTableDataCell>{tracker.lastConnected}</CTableDataCell>
                      <CTableDataCell>{tracker.location}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} lg={6}>
          <CCard>
            <CCardBody>
              <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                style={{ height: '400px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
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

      <CModal visible={showModal} onClose={handleCancel}>
        <CModalHeader>Register New Tracker</CModalHeader>
        <CModalBody>
          <CForm onSubmit={handleRegister}>
            <CFormInput
              type="text"
              label="Tracker Name"
              name="tracker_name"
              value={newTracker.tracker_name}
              onChange={handleInputChange}
              placeholder="Enter Tracker Name"
              className="mb-3"
              required
            />
            <CFormInput
              type="text"
              label="Tracker ID / Serial Number"
              name="tracker_id"
              value={newTracker.tracker_id}
              onChange={handleInputChange}
              placeholder="Enter Tracker ID or Serial Number"
              className="mb-3"
              required
            />
            <CFormSelect
              label="Device Type"
              name="device_type"
              value={newTracker.device_type}
              onChange={handleInputChange}
              className="mb-3"
              required
            >
              <option value="">Select Device Type</option>
              <option value="gps-only">GPS-only</option>
              <option value="gps-sensors">GPS + Sensors</option>
            </CFormSelect>
            <CFormInput
              type="text"
              label="Model Number"
              name="model_number"
              value={newTracker.model_number}
              onChange={handleInputChange}
              placeholder="Enter Model Number"
              className="mb-3"
            />
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" type="submit" onClick={handleRegister}>
            Register
          </CButton>
          <CButton color="secondary" onClick={handleCancel}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Trackers
