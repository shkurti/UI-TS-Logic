import React from 'react'
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CForm, CRow, CCol, CFormInput, CFormSelect, CButton, CBadge
} from '@coreui/react'
import { BsPlus } from 'react-icons/bs'

const ShipmentModal = ({
  visible,
  onClose,
  legs,
  setLegs,
  trackers,
  selectedTracker,
  setSelectedTracker,
  addLeg,
  submitForm,
  isMobile,
  handleInputChange,
}) => (
  <CModal
    visible={visible}
    onClose={onClose}
    size={isMobile ? 'sm' : 'lg'}
    backdrop="static"
    fullscreen={isMobile ? 'sm-down' : false}
  >
    <CModalHeader closeButton style={{
      background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
      color: 'white',
      border: 'none',
      padding: isMobile ? '12px 16px' : '16px 24px'
    }}>
      <h5 style={{
        margin: 0,
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: isMobile ? '1rem' : '1.25rem'
      }}>
        <BsPlus size={isMobile ? 16 : 20} />
        Create New Shipment
      </h5>
    </CModalHeader>
    <CModalBody style={{
      maxHeight: isMobile ? 'calc(100vh - 120px)' : '500px',
      overflowY: 'auto',
      padding: isMobile ? '16px' : '32px'
    }}>
      <CForm>
        {legs.map((leg, index) => (
          <div key={index} className="mb-4" style={{
            borderBottom: index < legs.length - 1 ? '1px solid #eee' : 'none',
            paddingBottom: 16,
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h6 style={{
              fontWeight: 600,
              fontSize: 16,
              marginBottom: 16,
              color: '#495057',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CBadge color="primary" style={{ fontSize: '12px' }}>
                Leg {leg.legNumber}
              </CBadge>
            </h6>
            <CRow className="mb-3">
              {index === 0 && (
                <CCol>
                  <CFormInput
                    label="Ship From Address *"
                    value={leg.shipFromAddress}
                    onChange={(e) => handleInputChange(index, 'shipFromAddress', e.target.value)}
                    placeholder="Enter origin address"
                    style={{ borderRadius: '8px' }}
                  />
                </CCol>
              )}
              {index < legs.length - 1 && (
                <CCol>
                  <CFormInput
                    label="Stop Address *"
                    value={leg.stopAddress}
                    onChange={(e) => handleInputChange(index, 'stopAddress', e.target.value)}
                    placeholder="Enter stop address"
                    style={{ borderRadius: '8px' }}
                  />
                </CCol>
              )}
              {index === legs.length - 1 && (
                <CCol>
                  <CFormInput
                    label="Ship To Address *"
                    value={leg.stopAddress}
                    onChange={(e) => handleInputChange(index, 'stopAddress', e.target.value)}
                    placeholder="Enter destination address"
                    style={{ borderRadius: '8px' }}
                  />
                </CCol>
              )}
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  type="datetime-local"
                  label="Ship Date *"
                  value={leg.shipDate}
                  onChange={(e) => handleInputChange(index, 'shipDate', e.target.value)}
                  style={{ borderRadius: '8px' }}
                />
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Transport Mode *"
                  value={leg.mode}
                  onChange={(e) => handleInputChange(index, 'mode', e.target.value)}
                  style={{ borderRadius: '8px' }}
                >
                  <option value="">Select Mode</option>
                  <option value="Road">🚛 Road</option>
                  <option value="Air">✈️ Air</option>
                  <option value="Sea">🚢 Sea</option>
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={4}>
                <CFormInput
                  label="Carrier *"
                  value={leg.carrier}
                  onChange={(e) => handleInputChange(index, 'carrier', e.target.value)}
                  placeholder="Enter carrier name"
                  style={{ borderRadius: '8px' }}
                />
              </CCol>
              <CCol md={4}>
                <CFormInput
                  type="datetime-local"
                  label="Arrival Date *"
                  value={leg.arrivalDate}
                  onChange={(e) => handleInputChange(index, 'arrivalDate', e.target.value)}
                  style={{ borderRadius: '8px' }}
                />
              </CCol>
              <CCol md={4}>
                <CFormInput
                  type="datetime-local"
                  label="Departure Date *"
                  value={leg.departureDate}
                  onChange={(e) => handleInputChange(index, 'departureDate', e.target.value)}
                  style={{ borderRadius: '8px' }}
                />
              </CCol>
            </CRow>
            {leg.mode === 'Air' && (
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    label="AWB (Air Waybill)"
                    value={leg.awb}
                    onChange={(e) => handleInputChange(index, 'awb', e.target.value)}
                    placeholder="Enter AWB number"
                    style={{ borderRadius: '8px' }}
                  />
                </CCol>
              </CRow>
            )}
          </div>
        ))}
        <CRow className="mb-4">
          <CCol md={8}>
            <CFormSelect
              label="Select Tracker *"
              value={selectedTracker}
              onChange={(e) => setSelectedTracker(e.target.value)}
              style={{ borderRadius: '8px' }}
            >
              <option value="">Choose a tracker device</option>
              {trackers.map((tracker) => (
                <option key={tracker.tracker_id} value={tracker.tracker_id}>
                  📍 {tracker.tracker_name} (ID: {tracker.tracker_id})
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={4} className="d-flex align-items-end">
            <CButton
              color="secondary"
              variant="outline"
              onClick={addLeg}
              style={{
                borderRadius: '8px',
                padding: '12px 16px',
                fontWeight: '500',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <BsPlus size={16} />
              Add Stop
            </CButton>
          </CCol>
        </CRow>
      </CForm>
    </CModalBody>
    <CModalFooter style={{
      border: 'none',
      padding: isMobile ? '12px 16px' : '24px 32px',
      background: '#f8f9fa'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px',
        width: '100%',
        justifyContent: 'flex-end'
      }}>
        <CButton
          color="secondary"
          variant="outline"
          onClick={onClose}
          style={{
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: '600',
            order: isMobile ? 2 : 1
          }}
        >
          Cancel
        </CButton>
        <CButton
          color="primary"
          onClick={submitForm}
          style={{
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)',
            order: isMobile ? 1 : 2
          }}
        >
          Create Shipment
        </CButton>
      </div>
    </CModalFooter>
  </CModal>
)

export default ShipmentModal
