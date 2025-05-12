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
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CForm,
  CFormSelect,
} from '@coreui/react'

const Shipments = () => {
  const [activeTab, setActiveTab] = useState('In Transit')
  const [shipments, setShipments] = useState([
    { id: 'S001', from: 'New York', to: 'Los Angeles', eta: '2023-10-05' },
    { id: 'S002', from: 'Chicago', to: 'Houston', eta: '2023-10-06' },
    { id: 'S003', from: 'Miami', to: 'Seattle', eta: '2023-10-07' },
  ])
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
    const isValid = legs.every((leg) =>
      ['shipFromAddress', 'shipDate', 'mode', 'carrier', 'stopAddress', 'arrivalDate', 'departureDate'].every(
        (field) => leg[field] && leg[field].trim() !== ''
      )
    )
    if (!isValid) {
      alert('Please fill all required fields.')
      return
    }

    const shipmentData = {
      legs: legs.map((leg) => ({
        legNumber: leg.legNumber,
        shipFromAddress: leg.shipFromAddress,
        shipDate: leg.shipDate,
        alertPresets: leg.alertPresets,
        mode: leg.mode,
        carrier: leg.carrier,
        stopAddress: leg.stopAddress,
        arrivalDate: leg.arrivalDate,
        departureDate: leg.departureDate,
        awb: leg.mode === 'Air' ? leg.awb : undefined,
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

  return (
    <>
      <CRow>
        <CCol xs={12} lg={4}>
          <CCard>
            <CCardHeader>
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
                  <CFormInput placeholder="Filter by Ship From" />
                </CCol>
                <CCol>
                  <CFormInput placeholder="Filter by Ship To" />
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
      <CButton color="primary" onClick={() => setIsModalOpen(true)}>
        Create New Shipment
      </CButton>
      <CModal visible={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CModalHeader>Create New Shipment</CModalHeader>
        <CModalBody style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <CForm>
            {legs.map((leg, index) => (
              <div key={index} className="mb-4">
                <h5>Leg {leg.legNumber}</h5>
                <CRow>
                  <CCol>
                    <CFormInput
                      label="Ship From Address"
                      value={leg.shipFromAddress}
                      onChange={(e) => handleInputChange(index, 'shipFromAddress', e.target.value)}
                      disabled={index !== 0} // Only the first leg has "Ship From Address"
                    />
                  </CCol>
                  {index === legs.length - 1 ? ( // Last leg has "Ship To Address"
                    <CCol>
                      <CFormInput
                        label="Ship To Address"
                        value={leg.stopAddress}
                        onChange={(e) => handleInputChange(index, 'stopAddress', e.target.value)}
                      />
                    </CCol>
                  ) : (
                    <CCol>
                      <CFormInput
                        label="Stop Address"
                        value={leg.stopAddress}
                        onChange={(e) => handleInputChange(index, 'stopAddress', e.target.value)}
                      />
                    </CCol>
                  )}
                </CRow>
                <CRow>
                  <CCol>
                    <CFormInput
                      type="date"
                      label="Ship Date"
                      value={leg.shipDate}
                      onChange={(e) => handleInputChange(index, 'shipDate', e.target.value)}
                    />
                  </CCol>
                  <CCol>
                    <CFormInput
                      type="date"
                      label="Arrival Date"
                      value={leg.arrivalDate}
                      onChange={(e) => handleInputChange(index, 'arrivalDate', e.target.value)}
                    />
                  </CCol>
                  <CCol>
                    <CFormInput
                      type="date"
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