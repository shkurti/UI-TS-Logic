import React from 'react'
import {
  CBadge,
  CButton,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CListGroup,
  CListGroupItem,
} from '@coreui/react'
import { BsSearch, BsPlus, BsTrash, BsInfoCircle } from 'react-icons/bs'

export const ShipmentsList = ({ 
  shipments, 
  searchTerm,
  setSearchTerm,
  handleShipmentClick,
  selectedShipmentsForDeletion,
  handleShipmentSelection,
  handleSelectAllShipments,
  openDeleteModal,
  setIsModalOpen
}) => {
  // Filter shipments by search term
  const filteredShipments = shipments.filter(shipment => 
    !searchTerm || 
    shipment.trackerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.legs?.[0]?.shipFromAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
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

        {/* Select All Checkbox */}
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
              checked={
                selectedShipmentsForDeletion.length === filteredShipments.length && 
                filteredShipments.length > 0
              }
              onChange={(e) => handleSelectAllShipments(e.target.checked, filteredShipments)}
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

        {/* Search */}
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

      {/* Shipments List */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <CListGroup flush>
          {filteredShipments.map((shipment, index) => (
            <ShipmentListItem 
              key={index}
              shipment={shipment}
              isSelected={selectedShipmentsForDeletion.includes(shipment._id)}
              handleShipmentSelection={handleShipmentSelection}
              handleShipmentClick={handleShipmentClick}
            />
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
  )
}

const ShipmentListItem = ({ 
  shipment, 
  isSelected, 
  handleShipmentSelection, 
  handleShipmentClick 
}) => {
  return (
    <CListGroupItem
      style={{
        border: 'none',
        borderBottom: '1px solid #f0f0f0',
        padding: '16px',
        backgroundColor: isSelected ? '#e3f2fd' : 'transparent'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Checkbox for selection */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => handleShipmentSelection(shipment._id, e.target.checked)}
          style={{ 
            cursor: 'pointer', 
            marginTop: '4px',
            transform: 'scale(1.1)'
          }}
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Shipment Content */}
        <div 
          style={{ flex: 1, cursor: 'pointer' }}
          onClick={() => handleShipmentClick(shipment)}
        >
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#2196f3', fontSize: '14px' }}>
                #{shipment.trackerId}
              </strong>
              <CBadge color="primary" style={{ fontSize: '10px' }}>
                In Transit
              </CBadge>
            </div>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
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
  )
}

export const MobileShipmentsList = ({ 
  shipments, 
  searchTerm,
  setSearchTerm,
  handleShipmentClick,
  setIsModalOpen
}) => {
  // Filter shipments by search term
  const filteredShipments = shipments.filter(shipment => 
    !searchTerm || 
    shipment.trackerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.legs?.[0]?.shipFromAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ 
      flex: 1, 
      overflow: 'auto',
      padding: '16px',
      background: '#f8f9fa'
    }}>
      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
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

      {/* Shipments Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredShipments.map((shipment, index) => (
          <div
            key={index}
            onClick={() => handleShipmentClick(shipment)}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: '1px solid #e9ecef'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <strong style={{ color: '#2196f3', fontSize: '14px' }}>
                #{shipment.trackerId}
              </strong>
              <CBadge color="primary" style={{ fontSize: '10px' }}>
                In Transit
              </CBadge>
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '6px' }}>
                <strong>From:</strong> {shipment.legs?.[0]?.shipFromAddress?.substring(0, 30) || 'N/A'}
                {shipment.legs?.[0]?.shipFromAddress?.length > 30 ? '...' : ''}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>To:</strong> {shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.substring(0, 30) || 'N/A'}
                {shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.length > 30 ? '...' : ''}
              </div>
              <div style={{ color: '#888' }}>
                <strong>ETA:</strong> {new Date(shipment.legs?.[shipment.legs.length - 1]?.arrivalDate).toLocaleDateString() || 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
