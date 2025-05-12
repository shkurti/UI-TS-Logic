import React, { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
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
  CFormSelect,
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
} from '@coreui/react'

const Shipments = () => {
  const [activeTab, setActiveTab] = useState('In Transit')
  const [shipments, setShipments] = useState([
    { id: 'S001', from: 'New York', to: 'Los Angeles', eta: '2023-10-05' },
    { id: 'S002', from: 'Chicago', to: 'Houston', eta: '2023-10-06' },
    { id: 'S003', from: 'Miami', to: 'Seattle', eta: '2023-10-07' },
  ])
  const [modalVisible, setModalVisible] = useState(false)
  const [legs, setLegs] = useState([
    { from: '', to: '', shipDate: '', arrivalDate: '', mode: '', carrier: '', awb: '', alerts: [], departureDate: '' },
  ])

  const handleInputChange = (index, field, value) => {
    const updatedLegs = [...legs]
    updatedLegs[index][field] = value
    setLegs(updatedLegs)
  }

  const handleAddLeg = () => {
    setLegs([
      ...legs,
      { from: '', to: '', shipDate: '', arrivalDate: '', mode: '', carrier: '', awb: '', alerts: [], departureDate: '' },
    ])
  }

  const handleSubmit = async () => {
    const formattedLegs = legs.map((leg) => ({
      ...leg,
      shipDate: leg.shipDate ? new Date(leg.shipDate).toISOString() : null,
      arrivalDate: leg.arrivalDate ? new Date(leg.arrivalDate).toISOString() : null,
      departureDate: leg.departureDate ? new Date(leg.departureDate).toISOString() : null,
    }))

    try {
      const response = await fetch('https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legs: formattedLegs }),
      })

      if (response.ok) {
        console.log('Shipment data submitted successfully')
        setModalVisible(false)
        setLegs([{ from: '', to: '', shipDate: '', arrivalDate: '', mode: '', carrier: '', awb: '', alerts: [], departureDate: '' }])
      } else {
        console.error('Failed to submit shipment data')
      }
    } catch (error) {
      console.error('Error submitting shipment data:', error)
    }
  }

  const handleCancel = () => {
    setModalVisible(false)
    setLegs([{ from: '', to: '', shipDate: '', arrivalDate: '', mode: '', carrier: '', awb: '', alerts: [], departureDate: '' }])
  }

  return (
    <>
      <CRow>
        <CCol xs={12} lg={4}>
          <CCard>
            <CCardHeader>
              <CButton color="primary" className="w-100 mb-3" onClick={() => setModalVisible(true)}>
                Create New Shipment
              </CButton>
              <CFormInput placeholder="Search Shipments" className="mb-3" />
              <CNav variant="tabs" role="tablist" className="mb-3">
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'In Transit'}
                    onClick={() => setActiveTab('In Transit')}
                  >
                    In Transit (123)
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
                  <CFormSelect>
                    <option>Filter by Ship From</option>
                    <option>New York</option>
                    <option>Chicago</option>
                    <option>Miami</option>
                  </CFormSelect>
                </CCol>
                <CCol>
                  <CFormSelect>
                    <option>Filter by Ship To</option>
                    <option>Los Angeles</option>
                    <option>Houston</option>
                    <option>Seattle</option>
                  </CFormSelect>
                </CCol>
              </CRow>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Shipment ID</CTableHeaderCell>
                    <CTableHeaderCell>Ship From</CTableHeaderCell>
                    <CTableHeaderCell>Ship To</CTableHeaderCell>
                    <CTableHeaderCell>ETA</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {shipments.map((shipment, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{shipment.id}</CTableDataCell>
                      <CTableDataCell>{shipment.from}</CTableDataCell>
                      <CTableDataCell>{shipment.to}</CTableDataCell>
                      <CTableDataCell>{shipment.eta}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} lg={8}>
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
              </MapContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal visible={modalVisible} onClose={handleCancel} size="lg">
        <CModalHeader>Create New Shipment</CModalHeader>
        <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {legs.map((leg, index) => (
            <div key={index} className="mb-4">
              <h5>Leg {index + 1}</h5>
              <CFormInput
                label="Ship From Address"
                placeholder="Enter Ship From Address"
                value={leg.from}
                onChange={(e) => handleInputChange(index, 'from', e.target.value)}
                className="mb-2"
              />
              <CFormInput
                type="datetime-local"
                label="Ship Date"
                value={leg.shipDate}
                onChange={(e) => handleInputChange(index, 'shipDate', e.target.value)}
                className="mb-2"
              />
              <CFormInput
                label="Stop Address"
                placeholder="Enter Stop Address"
                value={leg.to}
                onChange={(e) => handleInputChange(index, 'to', e.target.value)}
                className="mb-2"
              />
              <CFormInput
                type="datetime-local"
                label="Arrival Date"
                value={leg.arrivalDate}
                onChange={(e) => handleInputChange(index, 'arrivalDate', e.target.value)}
                className="mb-2"
              />
              <CFormSelect
                label="Mode"
                value={leg.mode}
                onChange={(e) => handleInputChange(index, 'mode', e.target.value)}
                className="mb-2"
              >
                <option value="">Select Mode</option>
                <option value="Road">Road</option>
                <option value="Air">Air</option>
                <option value="Sea">Sea</option>
              </CFormSelect>
              {leg.mode === 'Air' && (
                <CFormInput
                  label="AWB (Air Waybill)"
                  placeholder="Enter AWB Number"
                  value={leg.awb}
                  onChange={(e) => handleInputChange(index, 'awb', e.target.value)}
                  className="mb-2"
                />
              )}
              <CFormInput
                label="Carrier"
                placeholder="Enter Carrier Name"
                value={leg.carrier}
                onChange={(e) => handleInputChange(index, 'carrier', e.target.value)}
                className="mb-2"
              />
              <CFormSelect
                label="Alerts"
                multiple
                value={leg.alerts}
                onChange={(e) =>
                  handleInputChange(index, 'alerts', Array.from(e.target.selectedOptions, (opt) => opt.value))
                }
                className="mb-2"
              >
                <option value="Arrival departure">Arrival departure</option>
                <option value="Geofence outside New York">Geofence outside New York</option>
                <option value="001 - Light Changes">001 - Light Changes</option>
              </CFormSelect>
              <CFormInput
                type="datetime-local"
                label="Departure Date"
                value={leg.departureDate}
                onChange={(e) => handleInputChange(index, 'departureDate', e.target.value)}
                className="mb-2"
              />
            </div>
          ))}
          <CButton color="secondary" onClick={handleAddLeg}>
            Add Stop
          </CButton>
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={handleSubmit}>
            Submit
          </CButton>
          <CButton color="secondary" onClick={handleCancel}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Shipments
