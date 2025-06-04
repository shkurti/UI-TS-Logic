import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
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
  CBadge,
  CInputGroup,
  CInputGroupText,
  CListGroup,
  CListGroupItem,
} from '@coreui/react'
import { BsThermometerHalf, BsDroplet, BsBatteryHalf, BsSpeedometer2, BsSearch, BsPlus, BsTrash, BsMap, BsInfoCircle, BsArrowLeft, BsGeoAlt, BsWifi } from 'react-icons/bs'

// Define a custom marker icon
const customIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Enhanced current location marker - same as Shipments.js
const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `<div style="
    background: #ff4444;
    color: #fff;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    animation: pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
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

// Add a component to handle map invalidation
function MapInvalidator({ sidebarCollapsed, selectedTracker }) {
  const map = useMap()
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 350)
    
    return () => clearTimeout(timer)
  }, [sidebarCollapsed, selectedTracker, map])
  
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
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedTrackersForDeletion, setSelectedTrackersForDeletion] = useState([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isTrackerInfoExpanded, setIsTrackerInfoExpanded] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  // Add responsive detection
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [sidebarCollapsed])

  useEffect(() => {
    // Fetch initial list of trackers
    fetch('https://tslogics.com/trackers')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        const formattedTrackers = data.map((tracker) => ({
          ...tracker,
          batteryLevel: tracker.batteryLevel
            ? `${String(tracker.batteryLevel).replace('%', '')}%`
            : 'N/A',
          lastConnected: tracker.lastConnected !== undefined && tracker.lastConnected !== 'N/A' ? tracker.lastConnected : 'N/A',
          location:
            tracker.location && tracker.location !== 'N/A, N/A'
              ? tracker.location
              : 'N/A, N/A',
        }))
        setTrackers(formattedTrackers)
      })
      .catch((error) => console.error('Error fetching trackers:', error))

    // WebSocket for real-time updates
    const ws = new WebSocket('wss://backend-ts-68222fd8cfc0.herokuapp.com/ws')
    ws.onopen = () => console.log('WebSocket connection established')
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('WebSocket message received:', message)

        if (message.operationType === 'insert' && message.tracker_id) {
          setTrackers((prevTrackers) => {
            const trackerIndex = prevTrackers.findIndex(
              (tracker) => String(tracker.tracker_id) === String(message.tracker_id)
            )

            if (trackerIndex !== -1) {
              const updatedTrackers = [...prevTrackers]
              updatedTrackers[trackerIndex] = {
                ...updatedTrackers[trackerIndex],
                batteryLevel: message.new_record.battery
                  ? `${String(message.new_record.battery).replace('%', '')}%`
                  : updatedTrackers[trackerIndex].batteryLevel,
                lastConnected: message.new_record.timestamp || updatedTrackers[trackerIndex].lastConnected,
                location: message.geolocation
                  ? `${message.geolocation.Lat}, ${message.geolocation.Lng}`
                  : updatedTrackers[trackerIndex].location,
              }
              return updatedTrackers
            } else {
              return [
                ...prevTrackers,
                {
                  tracker_id: message.tracker_id,
                  batteryLevel: message.new_record.battery || 'N/A',
                  lastConnected: message.new_record.timestamp || 'N/A',
                  location: message.geolocation
                    ? `${message.geolocation.Lat}, ${message.geolocation.Lng}`
                    : 'N/A, N/A',
                },
              ]
            }
          })
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
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
      const response = await fetch('https://tslogics.com/register_tracker', {
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

  const handleTrackerSelection = (trackerId, isSelected) => {
    if (isSelected) {
      setSelectedTrackersForDeletion(prev => [...prev, trackerId])
    } else {
      setSelectedTrackersForDeletion(prev => prev.filter(id => id !== trackerId))
    }
  }

  const handleSelectAllTrackers = (isSelected) => {
    if (isSelected) {
      setSelectedTrackersForDeletion(filteredTrackers.map(t => t.tracker_id))
    } else {
      setSelectedTrackersForDeletion([])
    }
  }

  const deleteSelectedTrackers = async () => {
    if (selectedTrackersForDeletion.length === 0) {
      alert('No trackers selected for deletion.')
      return
    }

    try {
      const deletePromises = selectedTrackersForDeletion.map(trackerId =>
        fetch(`https://tslogics.com/delete_tracker/${trackerId}`, {
          method: 'DELETE'
        })
      )

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(response => response.ok).length
      const failureCount = results.length - successCount

      if (successCount > 0) {
        setTrackers(prev => prev.filter(t => !selectedTrackersForDeletion.includes(t.tracker_id)))
        
        if (selectedTracker && selectedTrackersForDeletion.includes(selectedTracker.tracker_id)) {
          setSelectedTracker(null)
        }
      }

      setSelectedTrackersForDeletion([])
      setIsDeleteModalOpen(false)

      if (failureCount === 0) {
        alert(`Successfully deleted ${successCount} tracker${successCount > 1 ? 's' : ''}.`)
      } else {
        alert(`Deleted ${successCount} tracker${successCount > 1 ? 's' : ''}, failed to delete ${failureCount}.`)
      }
    } catch (error) {
      console.error('Error deleting trackers:', error)
      alert('Error occurred while deleting trackers.')
    }
  }

  const openDeleteModal = () => {
    if (selectedTrackersForDeletion.length === 0) {
      alert('Please select trackers to delete.')
      return
    }
    setIsDeleteModalOpen(true)
  }

  const handleTrackerSelect = (tracker) => {
    setSelectedTracker(tracker)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const openSidebarToList = () => {
    setSidebarCollapsed(false)
    setSelectedTracker(null)
  }

  // Filter trackers based on search
  const filteredTrackers = trackers.filter(tracker => {
    const matchesSearch = !searchTerm || 
      tracker.tracker_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracker.tracker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracker.device_type?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Get battery level color
  const getBatteryColor = (batteryLevel) => {
    if (!batteryLevel || batteryLevel === 'N/A') return 'secondary'
    const level = parseInt(batteryLevel)
    if (level > 60) return 'success'
    if (level > 30) return 'warning'
    return 'danger'
  }

  // Get connection status
  const getConnectionStatus = (lastConnected) => {
    if (!lastConnected || lastConnected === 'N/A') return { status: 'Offline', color: 'secondary' }
    
    const lastTime = new Date(lastConnected)
    const now = new Date()
    const diffMinutes = (now - lastTime) / (1000 * 60)
    
    if (diffMinutes < 5) return { status: 'Online', color: 'success' }
    if (diffMinutes < 30) return { status: 'Recent', color: 'warning' }
    return { status: 'Offline', color: 'danger' }
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: 'calc(100vh - 40px)',
      width: '100vw',
      overflow: 'hidden',
      position: 'fixed',
      top: '40px',
      left: 0,
      margin: 0,
      padding: 0,
      zIndex: 1
    }}>
      {/* Mobile Layout */}
      {isMobile ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Mobile Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px',
            color: 'white',
            flexShrink: 0,
            position: 'relative'
          }}>
            {!selectedTracker ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h5 style={{ margin: 0, fontWeight: '600' }}>Device Trackers</h5>
                <CButton
                  color="light"
                  variant="outline"
                  size="sm"
                  onClick={handleRegisterTracker}
                  style={{ padding: '6px 12px' }}
                >
                  <BsPlus size={16} />
                </CButton>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <CButton
                    color="light"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTracker(null)}
                    style={{ padding: '6px 12px' }}
                  >
                    <BsArrowLeft size={14} />
                  </CButton>
                  <h6 style={{ margin: 0, fontWeight: '600' }}>
                    {selectedTracker.tracker_name || `Tracker #${selectedTracker.tracker_id}`}
                  </h6>
                </div>
              </div>
            )}
          </div>

          {!selectedTracker ? (
            /* Mobile Trackers List */
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
                    placeholder="Search trackers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </CInputGroup>
              </div>

              {/* Tracker Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredTrackers.map((tracker) => {
                  const connectionStatus = getConnectionStatus(tracker.lastConnected)
                  return (
                    <div
                      key={tracker.tracker_id}
                      onClick={() => handleTrackerSelect(tracker)}
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
                        <div>
                          <strong style={{ color: '#2196f3', fontSize: '14px' }}>
                            {tracker.tracker_name || `Tracker #${tracker.tracker_id}`}
                          </strong>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            ID: {tracker.tracker_id}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          <CBadge color={connectionStatus.color} style={{ fontSize: '10px' }}>
                            {connectionStatus.status}
                          </CBadge>
                          <CBadge color={getBatteryColor(tracker.batteryLevel)} style={{ fontSize: '10px' }}>
                            🔋 {tracker.batteryLevel}
                          </CBadge>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Location:</strong> {tracker.location !== 'N/A, N/A' ? tracker.location : 'Unknown'}
                        </div>
                        <div style={{ color: '#888' }}>
                          <strong>Last seen:</strong> {tracker.lastConnected !== 'N/A' ? 
                            new Date(tracker.lastConnected).toLocaleString() : 'Never'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Mobile Selected Tracker View */
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Expandable Tracker Info Card */}
              <div style={{
                background: 'white',
                margin: '12px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <div 
                  onClick={() => setIsTrackerInfoExpanded(!isTrackerInfoExpanded)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isTrackerInfoExpanded ? '1px solid #e9ecef' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                      Tracker Details
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {selectedTracker.tracker_name || `ID: ${selectedTracker.tracker_id}`}
                    </div>
                  </div>
                  <div style={{ 
                    transform: isTrackerInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    ▼
                  </div>
                </div>
                
                {isTrackerInfoExpanded && (
                  <div style={{ padding: '16px', fontSize: '13px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Device Type:</strong> {selectedTracker.device_type || 'N/A'}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Model:</strong> {selectedTracker.model_number || 'N/A'}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Battery:</strong> {selectedTracker.batteryLevel}
                    </div>
                    <div>
                      <strong>Status:</strong> {getConnectionStatus(selectedTracker.lastConnected).status}
                    </div>
                  </div>
                )}
              </div>

              {/* Map Section */}
              <div style={{
                background: 'white',
                margin: '0 12px 12px 12px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                flex: 1
              }}>
                <div 
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  style={{
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BsMap size={16} />
                    Tracker Location
                  </div>
                </div>
                
                <div style={{ height: 'calc(100% - 48px)' }}>
                  <MapContainer
                    center={selectedTracker.location && selectedTracker.location !== 'N/A, N/A' 
                      ? selectedTracker.location.split(', ').map(Number) 
                      : [51.505, -0.09]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="custom-map-container"
                  >
                    <MapInvalidator sidebarCollapsed={false} selectedTracker={selectedTracker} />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {selectedTracker && selectedTracker.location && selectedTracker.location !== 'N/A, N/A' && (
                      <>
                        <MapMover position={selectedTracker.location.split(', ').map(Number)} />
                        <Marker
                          position={selectedTracker.location.split(', ').map(Number)}
                          icon={currentLocationIcon}
                        >
                          <Popup>
                            <div style={{ minWidth: '200px' }}>
                              <strong>📍 Current Location</strong>
                              <br />
                              <strong>Tracker:</strong> {selectedTracker.tracker_name || 'Unknown Tracker'}
                              <br />
                              <strong>ID:</strong> {selectedTracker.tracker_id}
                              <br />
                              <strong>Battery:</strong> {selectedTracker.batteryLevel}
                              <br />
                              <strong>Last Connected:</strong> {selectedTracker.lastConnected || 'N/A'}
                              <br />
                              <small>Lat: {selectedTracker.location.split(', ')[0]}</small>
                              <br />
                              <small>Lng: {selectedTracker.location.split(', ')[1]}</small>
                            </div>
                          </Popup>
                        </Marker>
                      </>
                    )}
                  </MapContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Layout */
        <>
          {/* Sidebar */}
          <div style={{
            width: sidebarCollapsed 
              ? '0px' 
              : selectedTracker 
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
                {/* Sidebar Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '20px',
                  color: 'white',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  {!selectedTracker ? (
                    <>
                      <h4 style={{ 
                        margin: 0, 
                        marginBottom: '8px', 
                        fontWeight: '700',
                        fontSize: '1.5rem'
                      }}>
                        Device Tracker Management
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        opacity: 0.9, 
                        fontSize: '14px'
                      }}>
                        Register and monitor tracking devices
                      </p>
                    </>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <CButton
                          color="light"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTracker(null)}
                          style={{ padding: '6px 12px' }}
                        >
                          <BsArrowLeft size={14} />
                        </CButton>
                        <h5 style={{ 
                          margin: 0, 
                          fontWeight: '600',
                          fontSize: '1.25rem'
                        }}>
                          {selectedTracker.tracker_name || `Tracker #${selectedTracker.tracker_id}`}
                        </h5>
                      </div>
                      
                      {/* Tracker Details Summary */}
                      <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '13px'
                      }}>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>ID:</strong> {selectedTracker.tracker_id}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>Type:</strong> {selectedTracker.device_type || 'N/A'}
                        </div>
                        <div>
                          <strong>Status:</strong> {getConnectionStatus(selectedTracker.lastConnected).status}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {!selectedTracker ? (
                    <>
                      {/* Action Buttons */}
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
                            onClick={handleRegisterTracker}
                            style={{
                              flex: 1,
                              borderRadius: '8px',
                              padding: '10px',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}
                          >
                            <BsPlus size={16} style={{ marginRight: '6px' }} />
                            Register Tracker
                          </CButton>
                          <CButton
                            color="danger"
                            variant="outline"
                            disabled={selectedTrackersForDeletion.length === 0}
                            onClick={openDeleteModal}
                            style={{
                              borderRadius: '8px',
                              padding: '10px 16px',
                              fontSize: '14px'
                            }}
                          >
                            <BsTrash size={14} />
                            {selectedTrackersForDeletion.length > 0 && (
                              <span style={{ marginLeft: '6px' }}>
                                ({selectedTrackersForDeletion.length})
                              </span>
                            )}
                          </CButton>
                        </div>

                        {/* Select All Checkbox */}
                        {filteredTrackers.length > 0 && (
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
                              checked={selectedTrackersForDeletion.length === filteredTrackers.length && filteredTrackers.length > 0}
                              onChange={(e) => handleSelectAllTrackers(e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                            <label style={{ cursor: 'pointer', userSelect: 'none' }}>
                              Select All ({filteredTrackers.length})
                            </label>
                            {selectedTrackersForDeletion.length > 0 && (
                              <span style={{ color: '#007bff', fontWeight: '500' }}>
                                {selectedTrackersForDeletion.length} selected
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
                            placeholder="Search trackers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </CInputGroup>
                      </div>

                      {/* Trackers List */}
                      <div style={{ 
                        flex: 1, 
                        overflow: 'auto',
                        WebkitOverflowScrolling: 'touch'
                      }}>
                        <CListGroup flush>
                          {filteredTrackers.map((tracker) => {
                            const connectionStatus = getConnectionStatus(tracker.lastConnected)
                            return (
                              <CListGroupItem
                                key={tracker.tracker_id}
                                style={{
                                  border: 'none',
                                  borderBottom: '1px solid #f0f0f0',
                                  padding: '16px',
                                  transition: 'background 0.2s',
                                  backgroundColor: selectedTrackersForDeletion.includes(tracker.tracker_id) ? '#e3f2fd' : 'transparent'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                  {/* Checkbox for selection */}
                                  <input
                                    type="checkbox"
                                    checked={selectedTrackersForDeletion.includes(tracker.tracker_id)}
                                    onChange={(e) => handleTrackerSelection(tracker.tracker_id, e.target.checked)}
                                    style={{ 
                                      cursor: 'pointer', 
                                      marginTop: '4px',
                                      transform: 'scale(1.1)'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  
                                  {/* Tracker Content */}
                                  <div 
                                    style={{ 
                                      flex: 1, 
                                      cursor: 'pointer' 
                                    }}
                                    onClick={() => handleTrackerSelect(tracker)}
                                  >
                                    <div style={{ marginBottom: '8px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ 
                                          color: '#2196f3', 
                                          fontSize: '14px'
                                        }}>
                                          {tracker.tracker_name || `Tracker #${tracker.tracker_id}`}
                                        </strong>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          <CBadge color={connectionStatus.color} style={{ fontSize: '10px' }}>
                                            {connectionStatus.status}
                                          </CBadge>
                                          <CBadge color={getBatteryColor(tracker.batteryLevel)} style={{ fontSize: '10px' }}>
                                            🔋 {tracker.batteryLevel}
                                          </CBadge>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: '#666', 
                                      lineHeight: '1.4' 
                                    }}>
                                      <div style={{ marginBottom: '4px' }}>
                                        <strong>ID:</strong> {tracker.tracker_id}
                                      </div>
                                      <div style={{ marginBottom: '4px' }}>
                                        <strong>Location:</strong> {tracker.location !== 'N/A, N/A' ? tracker.location : 'Unknown'}
                                      </div>
                                      <div style={{ color: '#888' }}>
                                        Last seen: {tracker.lastConnected !== 'N/A' ? 
                                          new Date(tracker.lastConnected).toLocaleString() : 'Never'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CListGroupItem>
                            )
                          })}
                        </CListGroup>
                        
                        {filteredTrackers.length === 0 && (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '40px 20px', 
                            color: '#666',
                            fontSize: '14px'
                          }}>
                            <BsInfoCircle size={24} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <div>No trackers found</div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Tracker Details */}
                      <div style={{ 
                        flex: 1, 
                        overflow: 'auto', 
                        padding: '20px',
                        WebkitOverflowScrolling: 'touch'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Basic Info Card */}
                          <div style={{
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              padding: '12px 16px',
                              background: '#f8f9fa',
                              fontSize: '14px',
                              fontWeight: '600',
                              borderBottom: '1px solid #e9ecef'
                            }}>
                              📡 Device Information
                            </div>
                            <div style={{ padding: '16px', fontSize: '14px' }}>
                              <div style={{ marginBottom: '12px' }}>
                                <strong>Device Name:</strong> {selectedTracker.tracker_name || 'Unnamed'}
                              </div>
                              <div style={{ marginBottom: '12px' }}>
                                <strong>Tracker ID:</strong> {selectedTracker.tracker_id}
                              </div>
                              <div style={{ marginBottom: '12px' }}>
                                <strong>Device Type:</strong> {selectedTracker.device_type || 'N/A'}
                              </div>
                              <div>
                                <strong>Model Number:</strong> {selectedTracker.model_number || 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* Status Card */}
                          <div style={{
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              padding: '12px 16px',
                              background: '#f8f9fa',
                              fontSize: '14px',
                              fontWeight: '600',
                              borderBottom: '1px solid #e9ecef'
                            }}>
                              📊 Current Status
                            </div>
                            <div style={{ padding: '16px', fontSize: '14px' }}>
                              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong>Connection:</strong>
                                <CBadge color={getConnectionStatus(selectedTracker.lastConnected).color}>
                                  {getConnectionStatus(selectedTracker.lastConnected).status}
                                </CBadge>
                              </div>
                              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong>Battery Level:</strong>
                                <CBadge color={getBatteryColor(selectedTracker.batteryLevel)}>
                                  🔋 {selectedTracker.batteryLevel}
                                </CBadge>
                              </div>
                              <div style={{ marginBottom: '12px' }}>
                                <strong>Location:</strong> {selectedTracker.location !== 'N/A, N/A' ? selectedTracker.location : 'Unknown'}
                              </div>
                              <div>
                                <strong>Last Connected:</strong> {selectedTracker.lastConnected !== 'N/A' ? 
                                  new Date(selectedTracker.lastConnected).toLocaleString() : 'Never'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Toggle Button */}
          <div style={{
            position: 'fixed',
            top: '60px',
            left: sidebarCollapsed 
              ? '20px' 
              : (selectedTracker ? '470px' : '420px'),
            zIndex: 1001,
            transition: 'left 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <CButton
              color="primary"
              size="sm"
              onClick={toggleSidebar}
              style={{
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                border: '2px solid white',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {sidebarCollapsed ? '☰' : '✕'}
            </CButton>

            {/* Selected Tracker Info */}
            {sidebarCollapsed && selectedTracker && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                width: '350px',
                maxWidth: 'calc(100vw - 60px)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h6 style={{ margin: 0, marginBottom: '4px', fontWeight: '600', color: '#333' }}>
                      {selectedTracker.tracker_name || `Tracker #${selectedTracker.tracker_id}`}
                    </h6>
                    <CBadge color={getConnectionStatus(selectedTracker.lastConnected).color} style={{ fontSize: '10px' }}>
                      {getConnectionStatus(selectedTracker.lastConnected).status}
                    </CBadge>
                  </div>
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarCollapsed(false)}
                    style={{
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px'
                    }}
                  >
                    Details
                  </CButton>
                </div>
                
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>ID:</strong> {selectedTracker.tracker_id}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Battery:</strong> {selectedTracker.batteryLevel}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedTracker.location !== 'N/A, N/A' ? 'Available' : 'Unknown'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Full Page Map */}
          <div style={{ 
            flex: 1, 
            position: 'relative',
            height: 'calc(100vh - 40px)',
            overflow: 'hidden',
            margin: 0,
            padding: 0,
            minWidth: 0
          }}>
            <MapContainer
              center={selectedTracker && selectedTracker.location && selectedTracker.location !== 'N/A, N/A' 
                ? selectedTracker.location.split(', ').map(Number) 
                : [51.505, -0.09]}
              zoom={selectedTracker && selectedTracker.location && selectedTracker.location !== 'N/A, N/A' ? 13 : 5}
              style={{ 
                height: 'calc(100vh - 40px)',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1,
                margin: 0,
                padding: 0
              }}
              className="custom-map-container"
              zoomControl={true}
              attributionControl={true}
            >
              <MapInvalidator sidebarCollapsed={sidebarCollapsed} selectedTracker={selectedTracker} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {selectedTracker && selectedTracker.location && selectedTracker.location !== 'N/A, N/A' && (
                <>
                  <MapMover position={selectedTracker.location.split(', ').map(Number)} />
                  <Marker
                    position={selectedTracker.location.split(', ').map(Number)}
                    icon={currentLocationIcon}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <strong>📍 Current Location</strong>
                        <br />
                        <strong>Tracker:</strong> {selectedTracker.tracker_name || 'Unknown Tracker'}
                        <br />
                        <strong>ID:</strong> {selectedTracker.tracker_id}
                        <br />
                        <strong>Battery:</strong> {selectedTracker.batteryLevel}
                        <br />
                        <strong>Last Connected:</strong> {selectedTracker.lastConnected || 'N/A'}
                        <br />
                        <small>Lat: {selectedTracker.location.split(', ')[0]}</small>
                        <br />
                        <small>Lng: {selectedTracker.location.split(', ')[1]}</small>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>

            {/* Map Info Panel */}
            {sidebarCollapsed && !selectedTracker && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                maxWidth: '300px'
              }}>
                <h6 style={{ margin: 0, marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                  Tracker Management
                </h6>
                <p style={{ margin: 0, fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  Open the sidebar to view and manage trackers
                </p>
                <CButton
                  color="primary"
                  size="sm"
                  onClick={openSidebarToList}
                  style={{
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  View Trackers
                </CButton>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <CModal 
        visible={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
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
              Delete {selectedTrackersForDeletion.length} Tracker{selectedTrackersForDeletion.length > 1 ? 's' : ''}?
            </h6>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              This action cannot be undone. The selected tracker{selectedTrackersForDeletion.length > 1 ? 's' : ''} will be permanently removed from the system.
            </p>
          </div>
        </CModalBody>
        <CModalFooter style={{ border: 'none', padding: '16px 24px' }}>
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <CButton 
              color="secondary" 
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
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
              onClick={deleteSelectedTrackers}
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

      {/* Enhanced Registration Modal */}
      <CModal 
        visible={showModal} 
        onClose={handleCancel}
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
            Register New Tracker
          </h5>
        </CModalHeader>
        <CModalBody style={{ 
          maxHeight: isMobile ? 'calc(100vh - 120px)' : '500px', 
          overflowY: 'auto', 
          padding: isMobile ? '16px' : '32px' 
        }}>
          <CForm onSubmit={handleRegister}>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <CFormInput
                type="text"
                label="Tracker Name *"
                name="tracker_name"
                value={newTracker.tracker_name}
                onChange={handleInputChange}
                placeholder="Enter a friendly name for the tracker"
                className="mb-3"
                style={{ borderRadius: '8px' }}
                required
              />
              <CFormInput
                type="text"
                label="Tracker ID / Serial Number *"
                name="tracker_id"
                value={newTracker.tracker_id}
                onChange={handleInputChange}
                placeholder="Enter the unique tracker ID or serial number"
                className="mb-3"
                style={{ borderRadius: '8px' }}
                required
              />
              <CFormSelect
                label="Device Type *"
                name="device_type"
                value={newTracker.device_type}
                onChange={handleInputChange}
                className="mb-3"
                style={{ borderRadius: '8px' }}
                required
              >
                <option value="">Select Device Type</option>
                <option value="gps-only">📍 GPS-only Tracker</option>
                <option value="gps-sensors">📊 GPS + Environmental Sensors</option>
              </CFormSelect>
              <CFormInput
                type="text"
                label="Model Number"
                name="model_number"
                value={newTracker.model_number}
                onChange={handleInputChange}
                placeholder="Enter the device model number (optional)"
                style={{ borderRadius: '8px' }}
              />
            </div>
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
              onClick={handleCancel}
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
              onClick={handleRegister}
              style={{
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)',
                order: isMobile ? 1 : 2
              }}
            >
              Register Tracker
            </CButton>
          </div>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Trackers
