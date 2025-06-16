import React from 'react'
import {
  CButton, CInputGroup, CInputGroupText, CFormInput, CListGroup, CListGroupItem, CBadge, CNav, CNavItem, CNavLink
} from '@coreui/react'
import { BsPlus, BsTrash, BsSearch, BsArrowLeft, BsInfoCircle, BsThermometerHalf, BsExclamationTriangle, BsFileText } from 'react-icons/bs'

const Sidebar = ({
  sidebarCollapsed,
  selectedShipment,
  setSelectedShipment,
  setIsModalOpen,
  selectedShipmentsForDeletion,
  openDeleteModal,
  filteredShipments,
  handleSelectAllShipments,
  handleShipmentSelection,
  handleShipmentClick,
  searchTerm,
  setSearchTerm,
  shipmentTab,
  setShipmentTab,
}) => (
  <div style={{
    width: sidebarCollapsed
      ? '0px'
      : selectedShipment
        ? '450px'
        : '400px',
    background: '#fff',
    boxShadow: sidebarCollapsed ? 'none' : '2px 0 10px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    transition: 'width 0.3s ease, box-shadow 0.3s ease',
    position: 'relative',
    height: 'calc(100vh - 40px)',
    overflow: 'hidden',
    flexShrink: 0
  }}>
    {!sidebarCollapsed && (
      <>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          color: 'white',
          position: 'relative',
          flexShrink: 0
        }}>
          {!selectedShipment ? (
            <>
              <h4 style={{
                margin: 0,
                marginBottom: '8px',
                fontWeight: '700',
                fontSize: '1.5rem'
              }}>
                Shipment Management
              </h4>
              <p style={{
                margin: 0,
                opacity: 0.9,
                fontSize: '14px'
              }}>
                Track and manage shipments
              </p>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <CButton
                  color="light"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedShipment(null)}
                  style={{ padding: '6px 12px' }}
                >
                  <BsArrowLeft size={14} />
                </CButton>
                <h5 style={{
                  margin: 0,
                  fontWeight: '600',
                  fontSize: '1.25rem'
                }}>
                  Shipment #{selectedShipment.trackerId}
                </h5>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px'
              }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong>From:</strong> {selectedShipment.legs?.[0]?.shipFromAddress?.substring(0, 35) || 'N/A'}
                  {selectedShipment.legs?.[0]?.shipFromAddress?.length > 35 ? '...' : ''}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>To:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.stopAddress?.substring(0, 35) || 'N/A'}
                  {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.stopAddress?.length > 35 ? '...' : ''}
                </div>
                <div>
                  <strong>Arrival:</strong> {new Date(selectedShipment.legs?.[selectedShipment.legs.length - 1]?.arrivalDate).toLocaleDateString() || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!selectedShipment ? (
            <>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e9ecef',
                flexShrink: 0
              }}>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <CButton
                    color="primary"
                    onClick={() => setIsModalOpen(true)}
                    style={{
                      flex: 1,
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    <BsPlus size={16} style={{ marginRight: '6px' }} />
                    New Shipment
                  </CButton>
                  <CButton
                    color="danger"
                    variant="outline"
                    disabled={selectedShipmentsForDeletion.length === 0}
                    onClick={openDeleteModal}
                    style={{
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '14px'
                    }}
                  >
                    <BsTrash size={14} />
                    {selectedShipmentsForDeletion.length > 0 && (
                      <span style={{ marginLeft: '6px' }}>
                        ({selectedShipmentsForDeletion.length})
                      </span>
                    )}
                  </CButton>
                </div>
                {filteredShipments.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedShipmentsForDeletion.length === filteredShipments.length && filteredShipments.length > 0}
                      onChange={(e) => handleSelectAllShipments(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Select All ({filteredShipments.length})
                    </label>
                    {selectedShipmentsForDeletion.length > 0 && (
                      <span style={{ color: '#007bff', fontWeight: '500' }}>
                        {selectedShipmentsForDeletion.length} selected
                      </span>
                    )}
                  </div>
                )}
                <CInputGroup size="sm">
                  <CInputGroupText>
                    <BsSearch size={14} />
                  </CInputGroupText>
                  <CFormInput
                    placeholder="Search shipments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </CInputGroup>
              </div>
              <div style={{
                flex: 1,
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                <CListGroup flush>
                  {filteredShipments.map((shipment, index) => (
                    <CListGroupItem
                      key={index}
                      style={{
                        border: 'none',
                        borderBottom: '1px solid #f0f0f0',
                        padding: '16px',
                        transition: 'background 0.2s',
                        backgroundColor: selectedShipmentsForDeletion.includes(shipment._id) ? '#e3f2fd' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedShipmentsForDeletion.includes(shipment._id)}
                          onChange={(e) => handleShipmentSelection(shipment._id, e.target.checked)}
                          style={{
                            cursor: 'pointer',
                            marginTop: '4px',
                            transform: 'scale(1.1)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          style={{
                            flex: 1,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleShipmentClick(shipment)}
                        >
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{
                                color: '#2196f3',
                                fontSize: '14px'
                              }}>
                                #{shipment.trackerId}
                              </strong>
                              <CBadge color="primary" style={{ fontSize: '10px' }}>
                                In Transit
                              </CBadge>
                            </div>
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#666',
                            lineHeight: '1.4'
                          }}>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>From:</strong> {shipment.legs?.[0]?.shipFromAddress?.substring(0, 25) || 'N/A'}
                              {shipment.legs?.[0]?.shipFromAddress?.length > 25 ? '...' : ''}
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <strong>To:</strong> {shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.substring(0, 25) || 'N/A'}
                              {shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.length > 25 ? '...' : ''}
                            </div>
                            <div style={{ color: '#888' }}>
                              ETA: {new Date(shipment.legs?.[shipment.legs.length - 1]?.arrivalDate).toLocaleDateString() || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CListGroupItem>
                  ))}
                </CListGroup>
                {filteredShipments.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <BsInfoCircle size={24} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <div>No shipments found</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{
                borderBottom: '1px solid #e9ecef',
                padding: '0 16px',
                flexShrink: 0
              }}>
                <CNav variant="pills" style={{
                  gap: '4px',
                  padding: '12px 0',
                  flexWrap: 'wrap'
                }}>
                  {['Sensors', 'Alerts', 'Reports'].map((tab) => (
                    <CNavItem key={tab}>
                      <CNavLink
                        active={shipmentTab === tab}
                        onClick={() => setShipmentTab(tab)}
                        style={{
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '13px',
                          fontWeight: '500',
                          background: shipmentTab === tab ? '#e3f2fd' : 'transparent',
                          color: shipmentTab === tab ? '#1976d2' : '#666'
                        }}
                      >
                        {tab === 'Sensors' && <BsThermometerHalf size={14} style={{ marginRight: '4px' }} />}
                        {tab === 'Alerts' && <BsExclamationTriangle size={14} style={{ marginRight: '4px' }} />}
                        {tab === 'Reports' && <BsFileText size={14} style={{ marginRight: '4px' }} />}
                        {tab}
                      </CNavLink>
                    </CNavItem>
                  ))}
                </CNav>
              </div>
              {/* Tab content is handled in parent */}
            </>
          )}
        </div>
      </>
    )}
  </div>
)

export default Sidebar
