import React from 'react'
import { CModal, CModalHeader, CModalBody, CModalFooter, CButton } from '@coreui/react'
import { BsTrash } from 'react-icons/bs'

const DeleteModal = ({
  visible,
  onClose,
  onDelete,
  selectedCount,
}) => (
  <CModal
    visible={visible}
    onClose={onClose}
    size="sm"
    backdrop="static"
  >
    <CModalHeader closeButton style={{
      background: '#dc3545',
      color: 'white',
      border: 'none'
    }}>
      <h6 style={{ margin: 0, fontWeight: '600' }}>
        Confirm Deletion
      </h6>
    </CModalHeader>
    <CModalBody style={{ padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <BsTrash size={48} style={{ color: '#dc3545', marginBottom: '16px' }} />
        <h6 style={{ marginBottom: '12px', fontWeight: '600' }}>
          Delete {selectedCount} Shipment{selectedCount > 1 ? 's' : ''}?
        </h6>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
          This action cannot be undone. The selected shipment{selectedCount > 1 ? 's' : ''} will be permanently removed from the system.
        </p>
      </div>
    </CModalBody>
    <CModalFooter style={{ border: 'none', padding: '16px 24px' }}>
      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <CButton
          color="secondary"
          variant="outline"
          onClick={onClose}
          style={{
            flex: 1,
            borderRadius: '8px',
            padding: '10px',
            fontWeight: '500'
          }}
        >
          Cancel
        </CButton>
        <CButton
          color="danger"
          onClick={onDelete}
          style={{
            flex: 1,
            borderRadius: '8px',
            padding: '10px',
            fontWeight: '500'
          }}
        >
          Delete
        </CButton>
      </div>
    </CModalFooter>
  </CModal>
)

export default DeleteModal
