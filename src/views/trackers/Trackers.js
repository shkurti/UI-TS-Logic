import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
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

const Trackers = () => {
  const [trackers, setTrackers] = useState([
    { id: 'T001', battery: '85%', lastConnected: '2023-10-01 12:30', location: [42.798939, -74.658409] },
    { id: 'T002', battery: '60%', lastConnected: '2023-10-01 11:15', location: [42.799939, -74.659409] },
    { id: 'T003', battery: '45%', lastConnected: '2023-10-01 10:45', location: [42.800939, -74.660409] },
  ])
  const [showModal, setShowModal] = useState(false)

  const handleRegisterTracker = () => {
    setShowModal(true)
  }

  const handleCancel = () => {
    setShowModal(false)
  }

  const handleRegister = () => {
    // Logic to register a new tracker
    alert('Tracker Registered!')
    setShowModal(false)
  }

  const handleDeleteSelected = () => {
    // Logic to delete selected trackers
    alert('Delete Selected Tracker clicked!')
  }

  return (
    <>
      <CRow>
        <CCol xs={12} lg={6}>
          <CCard>
            <CCardHeader>
              <CButton color="primary" className="me-2" onClick={handleRegisterTracker}>
                Register New Tracker
              </CButton>
              <CButton color="danger" onClick={handleDeleteSelected}>
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
                  {trackers.map((tracker, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{tracker.id}</CTableDataCell>
                      <CTableDataCell>{tracker.battery}</CTableDataCell>
                      <CTableDataCell>{tracker.lastConnected}</CTableDataCell>
                      <CTableDataCell>{tracker.location.join(', ')}</CTableDataCell>
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
                center={[42.798939, -74.658409]}
                zoom={13}
                style={{ height: '400px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {trackers.map((tracker, index) => (
                  <Marker key={index} position={tracker.location} icon={customIcon}>
                    <Popup>
                      <strong>Tracker ID:</strong> {tracker.id}
                      <br />
                      <strong>Battery:</strong> {tracker.battery}
                      <br />
                      <strong>Last Connected:</strong> {tracker.lastConnected}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal visible={showModal} onClose={handleCancel}>
        <CModalHeader>Register New Tracker</CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput
              type="text"
              label="Tracker Name"
              placeholder="Enter Tracker Name"
              className="mb-3"
            />
            <CFormInput
              type="text"
              label="Tracker ID / Serial Number"
              placeholder="Enter Tracker ID or Serial Number"
              className="mb-3"
            />
            <CFormSelect label="Device Type" className="mb-3">
              <option>Select Device Type</option>
              <option>Type A</option>
              <option>Type B</option>
              <option>Type C</option>
            </CFormSelect>
            <CFormInput
              type="text"
              label="Model Number"
              placeholder="Enter Model Number"
              className="mb-3"
            />
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={handleRegister}>
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
