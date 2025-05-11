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
    { from: '', to: '', shipDate: '', arrivalDate: '', mode: '', carrier: '',  alerts: [] },
  ])

  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    setLegs([
      ...legs,
      {
        from: lastLeg.to, // Use the previous leg's Stop Address as the new leg's Ship From Address
        to: '',
        shipDate: '',
        arrivalDate: '',
        mode: '',
        carrier: '',
        alerts: [],
      },
    ]);
  }

  const handleInputChange = (index, field, value) => {
    const updatedLegs = [...legs];
    updatedLegs[index][field] = value;
    setLegs(updatedLegs);
  };

  const handleSubmit = async () => {
    try {
      // Format the legs data to ensure proper date handling
      const formattedLegs = legs.map((leg) => ({
        ...leg,
        shipDate: leg.shipDate ? new Date(leg.shipDate).toISOString() : null, // Convert to ISO 8601 format
        arrivalDate: leg.arrivalDate ? new Date(leg.arrivalDate).toISOString() : null, // Convert to ISO 8601 format
      }));

      console.log("Formatted legs data:", formattedLegs); // Debugging log

      const response = await fetch('https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ legs: formattedLegs }),
      });

      if (response.ok) {
        console.log('Shipment data submitted successfully');
        setModalVisible(false);
        setLegs([{ from: '', to: '', shipDate: '', arrivalDate: '', mode: '', carrier: '', alerts: [] }]);
      } else {
        console.error('Failed to submit shipment data');
      }
    } catch (error) {
      console.error('Error submitting shipment data:', error);
    }
  };

  const handleCancel = () => {
    setModalVisible(false)
    setLegs([
      { from: '', to: '', shipDate: '', arrivalDate: '', mode: '', carrier: '',  alerts: [] },
    ])
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

      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} size="lg">
        <CModalHeader>Create New Shipment</CModalHeader>
        <CModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {legs.map((leg, index) => (
            <div key={index} className="mb-4">
              <h5>Leg {index + 1}</h5>
              <CFormInput
                placeholder="Ship From Address"
                value={leg.from}
                onChange={(e) => handleInputChange(index, 'from', e.target.value)}
                className="mb-2"
              />
              <CFormInput
                type="datetime-local"
                placeholder="Ship Date"
                value={leg.shipDate}
                onChange={(e) => handleInputChange(index, 'shipDate', e.target.value)}
                className="mb-2"
              />
              <CFormInput
                placeholder="Stop Address"
                value={leg.to}
                onChange={(e) => handleInputChange(index, 'to', e.target.value)}
                className="mb-2"
              />
              <CFormInput
                type="datetime-local"
                placeholder="Arrival Date"
                value={leg.arrivalDate}
                onChange={(e) => handleInputChange(index, 'arrivalDate', e.target.value)}
                className="mb-2"
              />
              <CFormSelect
                value={leg.mode}
                onChange={(e) => handleInputChange(index, 'mode', e.target.value)}
                className="mb-2"
              >
                <option value="">Select Mode</option>
                <option value="Road">Road</option>
                <option value="Air">Air</option>
                <option value="Sea">Sea</option>
              </CFormSelect>
              <CFormInput
                placeholder="Carrier"
                value={leg.carrier}
                onChange={(e) => handleInputChange(index, 'carrier', e.target.value)}
                className="mb-2"
              />

              <CFormSelect
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
