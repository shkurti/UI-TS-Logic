import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CNav,
  CNavItem,
  CNavLink,
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
  CFormSelect,
} from '@coreui/react'
import { BsThermometerHalf, BsDroplet, BsBatteryHalf, BsSpeedometer2 } from 'react-icons/bs' // Changed BsSun to BsSpeedometer2
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const customIcon = window.L
  ? window.L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    })
  : null

function FitBounds({ route }) {
  const map = useMap()
  useEffect(() => {
    if (route.length > 0) {
      map.fitBounds(route)
    }
  }, [route, map])
  return null
}

const Shipments = () => {
  const [activeTab, setActiveTab] = useState('In Transit')
  const [shipments, setShipments] = useState([]) // Fetch shipments from the backend
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [legs, setLegs] = useState([
    {
      legNumber: 1,
      shipFromAddress: '',
      shipDate: '',
      alertPresets: [],
      mode: '',
      carrier: '',
      stopAddress: '',
      arrivalDate: '',
      departureDate: '',
      awb: '',
    },
  ])
  const [trackers, setTrackers] = useState([])
  const [selectedTracker, setSelectedTracker] = useState('')
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [routeData, setRouteData] = useState([])
  // Add sensor tab state
  const [shipmentTab, setShipmentTab] = useState('Details')
  const [activeSensor, setActiveSensor] = useState('Temperature')
  const [temperatureData, setTemperatureData] = useState([])
  const [humidityData, setHumidityData] = useState([])
  const [batteryData, setBatteryData] = useState([])
  const [speedData, setSpeedData] = useState([])

  useEffect(() => {
    // Fetch shipments from the backend
    const fetchShipments = async () => {
      try {
        const response = await fetch('https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_meta')
        if (response.ok) {
          const data = await response.json()
          setShipments(data) // Populate the shipment list
        } else {
          console.error('Failed to fetch shipments')
        }
      } catch (error) {
        console.error('Error fetching shipments:', error)
      }
    }

    // Fetch registered trackers
    const fetchTrackers = async () => {
      try {
        const response = await fetch('https://backend-ts-68222fd8cfc0.herokuapp.com/registered_trackers')
        if (response.ok) {
          const data = await response.json()
          setTrackers(data)
        } else {
          console.error('Failed to fetch trackers')
        }
      } catch (error) {
        console.error('Error fetching trackers:', error)
      }
    }

    fetchShipments()
    fetchTrackers()
  }, [])

  const addLeg = () => {
    setLegs([
      ...legs,
      {
        legNumber: legs.length + 1,
        shipFromAddress: '',
        shipDate: '',
        alertPresets: [],
        mode: '',
        carrier: '',
        stopAddress: '',
        arrivalDate: '',
        departureDate: '',
        awb: '',
      },
    ])
  }

  const handleInputChange = (index, field, value) => {
    const updatedLegs = [...legs]
    updatedLegs[index][field] = value
    setLegs(updatedLegs)
  }

  const submitForm = async () => {
    if (!selectedTracker) {
      alert('Please select a tracker.')
      return
    }

    const isValid = legs.every((leg, index) => {
      const requiredFields = ['shipDate', 'mode', 'carrier', 'arrivalDate', 'departureDate']

      if (index === 0) {
        requiredFields.push('shipFromAddress') // First leg requires Ship From Address
      }

      if (index === legs.length - 1) {
        requiredFields.push('stopAddress') // Last leg requires Ship To Address
      } else {
        requiredFields.push('stopAddress') // Intermediate legs require Stop Address
      }

      return requiredFields.every((field) => leg[field] && leg[field].trim() !== '')
    })

    if (!isValid) {
      alert('Please fill all required fields.')
      return
    }

    const shipmentData = {
      trackerId: selectedTracker, // Include the selected tracker ID
      legs: legs.map((leg, index) => ({
        legNumber: leg.legNumber,
        shipFromAddress: index === 0 ? leg.shipFromAddress : undefined, // Include only for the first leg
        shipDate: leg.shipDate,
        alertPresets: leg.alertPresets,
        mode: leg.mode,
        carrier: leg.carrier,
        stopAddress: leg.stopAddress, // Stop Address for intermediate and last legs
        arrivalDate: leg.arrivalDate,
        departureDate: leg.departureDate,
        awb: leg.mode === 'Air' ? leg.awb : undefined, // Include AWB only for Air mode
      })),
    }

    try {
      const response = await fetch('https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Shipment inserted successfully:', result)
        alert('Shipment created successfully!')
        setShipments((prevShipments) => [...prevShipments, shipmentData]) // Add the new shipment to the list
        setIsModalOpen(false)
        setLegs([
          {
            legNumber: 1,
            shipFromAddress: '',
            shipDate: '',
            alertPresets: [],
            mode: '',
            carrier: '',
            stopAddress: '',
            arrivalDate: '',
            departureDate: '',
            awb: '',
          },
        ])
      } else {
        const error = await response.json()
        console.error('Error inserting shipment:', error)
        alert('Failed to create shipment.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred.')
    }
  }

  const handleShipmentClick = async (shipment) => {
    setSelectedShipment(shipment)
    setShipmentTab('Details')
    setActiveSensor('Temperature')
    setTemperatureData([])
    setHumidityData([])
    setBatteryData([])
    setSpeedData([])
    const trackerId = shipment.trackerId
    const legs = shipment.legs || []
    const firstLeg = legs[0] || {}
    const lastLeg = legs[legs.length - 1] || {}
    const shipDate = firstLeg.shipDate
    const arrivalDate = lastLeg.arrivalDate

    if (!trackerId || !shipDate || !arrivalDate) {
      setRouteData([])
      return
    }

    try {
      const params = new URLSearchParams({
        tracker_id: trackerId,
        start: shipDate,
        end: arrivalDate,
      })
      const response = await fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_route_data?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRouteData(data)
        // Populate sensor data for tabs
        setTemperatureData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            temperature: record.temperature !== undefined ? parseFloat(record.temperature) : null,
          }))
        )
        setHumidityData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            humidity: record.humidity !== undefined ? parseFloat(record.humidity) : null,
          }))
        )
        setBatteryData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            battery: record.battery !== undefined ? parseFloat(record.battery) : null,
          }))
        )
        setSpeedData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            speed: record.speed !== undefined ? parseFloat(record.speed) : null,
          }))
        )
      } else {
        setRouteData([])
      }
    } catch (e) {
      setRouteData([])
    }
  }

  const deleteShipment = async () => {
    if (!selectedShipment) {
      alert('Please select a shipment to delete.')
      return
    }
    if (!window.confirm('Are you sure you want to delete this shipment?')) {
      return
    }
    try {
      const response = await fetch(
        `https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_meta/${selectedShipment._id}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        setShipments((prev) => prev.filter((s) => s._id !== selectedShipment._id))
        setSelectedShipment(null)
        setRouteData([])
        alert('Shipment deleted successfully.')
      } else {
        alert('Failed to delete shipment.')
      }
    } catch (e) {
      alert('Error deleting shipment.')
    }
  }

  return (
    <>
      <CRow>
        <CCol xs={12} lg={12}>
          <CCard>
            <CCardBody>
              <MapContainer
                center={[42.798939, -74.658409]}
                zoom={5}
                style={{ height: '600px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {routeData.length > 0 && (
                  <>
                    <FitBounds route={routeData.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)])} />
                    <Polyline
                      positions={routeData.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)])}
                      color="blue"
                    />
                    <Marker
                      position={[
                        parseFloat(routeData[routeData.length - 1].latitude),
                        parseFloat(routeData[routeData.length - 1].longitude),
                      ]}
                      icon={customIcon}
                    >
                      <Popup>Last Point</Popup>
                    </Marker>
                  </>
                )}
              </MapContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <CButton color="primary" onClick={() => setIsModalOpen(true)}>
                  Create New Shipment
                </CButton>
                <CButton
                  color="danger"
                  disabled={!selectedShipment}
                  onClick={deleteShipment}
                >
                  Delete Selected Shipment
                </CButton>
              </div>
              <CFormInput placeholder="Search Shipments" className="mb-3" />
              <CNav variant="tabs" role="tablist" className="mb-3">
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'In Transit'}
                    onClick={() => setActiveTab('In Transit')}
                  >
                    In Transit ({shipments.length})
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'Upcoming'}
                    onClick={() => setActiveTab('Upcoming')}
                  >
                    Upcoming (8)
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'Completed'}
                    onClick={() => setActiveTab('Completed')}
                  >
                    Completed (23)
                  </CNavLink>
                </CNavItem>
              </CNav>
              <CRow className="mb-3">
                <CCol>
                  <CFormInput placeholder="Filter by Ship From" />
                </CCol>
                <CCol>
                  <CFormInput placeholder="Filter by Ship To" />
                </CCol>
              </CRow>
            </CCardHeader>
            <CCardBody style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
              <div style={{ minWidth: 900 }}>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Shipment ID</CTableHeaderCell>
                      <CTableHeaderCell>Ship From</CTableHeaderCell>
                      <CTableHeaderCell>Ship To</CTableHeaderCell>
                      <CTableHeaderCell>Arrival Date</CTableHeaderCell>
                      <CTableHeaderCell>Departure Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {shipments.map((shipment, index) => (
                      <CTableRow
                        key={index}
                        style={{ cursor: 'pointer', background: selectedShipment === shipment ? '#f0f0f0' : undefined }}
                        onClick={() => handleShipmentClick(shipment)}
                      >
                        <CTableDataCell>{shipment.trackerId || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{shipment.legs?.[0]?.shipFromAddress || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{shipment.legs?.[shipment.legs.length - 1]?.stopAddress || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{shipment.legs?.[shipment.legs.length - 1]?.arrivalDate || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{shipment.legs?.[shipment.legs.length - 1]?.departureDate || 'N/A'}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      {/* Shipment Details/Sensors/Alerts/Reports Tabs */}
      {selectedShipment && (
        <CRow>
          <CCol xs={12}>
            <CCard className="mb-4">
              <CCardHeader>
                <CNav variant="tabs" role="tablist">
                  <CNavItem>
                    <CNavLink
                      active={shipmentTab === 'Details'}
                      onClick={() => setShipmentTab('Details')}
                    >
                      Details
                    </CNavLink>
                  </CNavItem>
                  <CNavItem>
                    <CNavLink
                      active={shipmentTab === 'Sensors'}
                      onClick={() => setShipmentTab('Sensors')}
                    >
                      Sensors
                    </CNavLink>
                  </CNavItem>
                  <CNavItem>
                    <CNavLink
                      active={shipmentTab === 'Alerts'}
                      onClick={() => setShipmentTab('Alerts')}
                    >
                      Alerts
                    </CNavLink>
                  </CNavItem>
                  <CNavItem>
                    <CNavLink
                      active={shipmentTab === 'Reports'}
                      onClick={() => setShipmentTab('Reports')}
                    >
                      Reports
                    </CNavLink>
                  </CNavItem>
                </CNav>
              </CCardHeader>
              <CCardBody>
                {shipmentTab === 'Details' && (
                  <>
                    <p>
                      <strong>Shipment ID:</strong> {selectedShipment.trackerId}
                    </p>
                    <p>
                      <strong>Ship From:</strong> {selectedShipment.legs?.[0]?.shipFromAddress || 'N/A'}
                    </p>
                    <p>
                      <strong>Ship To:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.stopAddress || 'N/A'}
                    </p>
                    <p>
                      <strong>Arrival Date:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.arrivalDate || 'N/A'}
                    </p>
                    <p>
                      <strong>Departure Date:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.departureDate || 'N/A'}
                    </p>
                  </>
                )}
                {shipmentTab === 'Sensors' && (
                  <>
                    <div className="sensor-icons d-flex justify-content-around mb-4">
                      <div
                        className={`sensor-icon-wrapper ${activeSensor === 'Temperature' ? 'active' : ''}`}
                        onClick={() => setActiveSensor('Temperature')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 12, cursor: 'pointer' }}
                      >
                        <BsThermometerHalf size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Temperature</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper ${activeSensor === 'Humidity' ? 'active' : ''}`}
                        onClick={() => setActiveSensor('Humidity')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 12, cursor: 'pointer' }}
                      >
                        <BsDroplet size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Humidity</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper ${activeSensor === 'Battery' ? 'active' : ''}`}
                        onClick={() => setActiveSensor('Battery')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 12, cursor: 'pointer' }}
                      >
                        <BsBatteryHalf size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Battery</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper ${activeSensor === 'Speed' ? 'active' : ''}`}
                        onClick={() => setActiveSensor('Speed')}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 12, cursor: 'pointer' }}
                      >
                        <BsSpeedometer2 size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Speed</span>
                      </div>
                    </div>
                    {activeSensor === 'Temperature' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={temperatureData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={false} />
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
                        <LineChart data={humidityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={false} />
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
                        <LineChart data={batteryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={false} />
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
                    {activeSensor === 'Speed' && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={speedData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tick={false} />
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
                  </>
                )}
                {shipmentTab === 'Alerts' && <div>Alerts content</div>}
                {shipmentTab === 'Reports' && <div>Reports content</div>}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
      <CModal visible={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CModalHeader>Create New Shipment</CModalHeader>
        <CModalBody style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormSelect
                  label="Select Tracker"
                  value={selectedTracker}
                  onChange={(e) => setSelectedTracker(e.target.value)}
                >
                  <option value="">Select a Tracker</option>
                  {trackers.map((tracker) => (
                    <option key={tracker.tracker_id} value={tracker.tracker_id}>
                      {tracker.tracker_name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
            {legs.map((leg, index) => (
              <div key={index} className="mb-4">
                <h5>Leg {leg.legNumber}</h5>
                <CRow>
                  {index === 0 && (
                    <CCol>
                      <CFormInput
                        label="Ship From Address"
                        value={leg.shipFromAddress}
                        onChange={(e) => handleInputChange(index, 'shipFromAddress', e.target.value)}
                      />
                    </CCol>
                  )}
                  {index < legs.length - 1 && (
                    <CCol>
                      <CFormInput
                        label="Stop Address"
                        value={leg.stopAddress}
                        onChange={(e) => handleInputChange(index, 'stopAddress', e.target.value)}
                      />
                    </CCol>
                  )}
                  {index === legs.length - 1 && (
                    <CCol>
                      <CFormInput
                        label="Ship To Address"
                        value={leg.stopAddress}
                        onChange={(e) => handleInputChange(index, 'stopAddress', e.target.value)}
                      />
                    </CCol>
                  )}
                </CRow>
                <CRow>
                  <CCol>
                    <CFormInput
                      type="datetime-local"
                      label="Ship Date"
                      value={leg.shipDate}
                      onChange={(e) => handleInputChange(index, 'shipDate', e.target.value)}
                    />
                  </CCol>
                  <CCol>
                    <CFormSelect
                      label="Mode"
                      value={leg.mode}
                      onChange={(e) => handleInputChange(index, 'mode', e.target.value)}
                    >
                      <option value="">Select Mode</option>
                      <option value="Road">Road</option>
                      <option value="Air">Air</option>
                      <option value="Sea">Sea</option>
                    </CFormSelect>
                  </CCol>
                </CRow>
                <CRow>
                  <CCol>
                    <CFormInput
                      label="Carrier"
                      value={leg.carrier}
                      onChange={(e) => handleInputChange(index, 'carrier', e.target.value)}
                    />
                  </CCol>
                  <CCol>
                    <CFormInput
                      type="datetime-local"
                      label="Arrival Date"
                      value={leg.arrivalDate}
                      onChange={(e) => handleInputChange(index, 'arrivalDate', e.target.value)}
                    />
                  </CCol>
                  <CCol>
                    <CFormInput
                      type="datetime-local"
                      label="Departure Date"
                      value={leg.departureDate}
                      onChange={(e) => handleInputChange(index, 'departureDate', e.target.value)}
                    />
                  </CCol>
                </CRow>
                {leg.mode === 'Air' && (
                  <CFormInput
                    label="AWB"
                    value={leg.awb}
                    onChange={(e) => handleInputChange(index, 'awb', e.target.value)}
                  />
                )}
              </div>
            ))}
            <CButton color="secondary" onClick={addLeg}>
              Add Stop
            </CButton>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={submitForm}>
            Submit
          </CButton>
          <CButton color="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Shipments