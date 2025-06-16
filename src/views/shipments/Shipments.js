import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker } from 'react-leaflet'
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
  CBadge,
  CAlert,
  CSpinner,
  CInputGroup,
  CInputGroupText,
  CListGroup,
  CListGroupItem,
} from '@coreui/react'
import { BsThermometerHalf, BsDroplet, BsBatteryHalf, BsSpeedometer2, BsSearch, BsFilter, BsPlus, BsTrash, BsMap, BsInfoCircle, BsGeoAlt, BsArrowLeft, BsExclamationTriangle, BsFileText } from 'react-icons/bs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import L from 'leaflet'
import Sidebar from './components/shipments/Sidebar'
import ShipmentModal from './components/shipments/ShipmentModal'
import DeleteModal from './components/shipments/DeleteModal'
import {
  geocodeAddress,
  getRegionName,
  createClusterIcon,
  numberIcon,
  currentLocationIcon,
  hoverMarkerIcon
} from './utils/shipments'

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

// Add a component to handle map invalidation
function MapInvalidator({ sidebarCollapsed, selectedShipment }) {
  const map = useMap()
  
  useEffect(() => {
    // Add a small delay to ensure DOM transition is complete
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 350) // Slightly longer than the CSS transition (0.3s)
    
    return () => clearTimeout(timer)
  }, [sidebarCollapsed, selectedShipment, map])
  
  return null
}

// Add FitWorld component
function FitWorld({ trigger }) {
  const map = useMap()
  useEffect(() => {
    map.fitWorld()
  }, [trigger, map])
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
  // Add state for new shipment preview polyline
  const [newShipmentPreview, setNewShipmentPreview] = useState(null);
  const [previewMarkers, setPreviewMarkers] = useState([]); // New state for preview markers
  // Add state for destination coordinate (for efficient access)
  const [destinationCoord, setDestinationCoord] = useState(null);
  // Add this state to store the live GPS route for the selected shipment
  const [liveRoute, setLiveRoute] = useState([]);
  // Add state for geocoded start coordinate
  const [startCoord, setStartCoord] = useState(null);
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [shipFromFilter, setShipFromFilter] = useState('')
  const [shipToFilter, setShipToFilter] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedShipmentsForDeletion, setSelectedShipmentsForDeletion] = useState([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  // Add new state for mobile-specific UI
  const [isShipmentInfoExpanded, setIsShipmentInfoExpanded] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [mobileSensorTab, setMobileSensorTab] = useState('Temperature')

  // Add timezone detection
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Add state for hover marker
  const [hoverMarker, setHoverMarker] = useState(null)

  // Add new state for shipment clustering
  const [shipmentClusters, setShipmentClusters] = useState([])
  const [isLoadingClusters, setIsLoadingClusters] = useState(false)

  // Add state for all leg coordinates
  const [allLegCoords, setAllLegCoords] = useState([])

  // Add responsive detection
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      // Auto-collapse sidebar on mobile initially
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [sidebarCollapsed])

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

  // Add state for WebSocket connection
  const [ws, setWs] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // Add state for real-time polling
  const [isPolling, setIsPolling] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(null)

  // WebSocket connection management
  const connectWebSocket = () => {
    try {
      const websocket = new WebSocket('wss://backend-ts-68222fd8cfc0.herokuapp.com/ws')
      
      websocket.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setWs(websocket)
      }
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      websocket.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        setWs(null)
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      // Retry connection after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }
  }

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    if (!selectedShipment) return

    // Check if the message is for the currently selected shipment
    if (data.trackerId === selectedShipment.trackerId) {
      // Update GPS position if available
      if (data.latitude && data.longitude && 
          !isNaN(parseFloat(data.latitude)) && 
          !isNaN(parseFloat(data.longitude))) {
        
        const newPosition = [parseFloat(data.latitude), parseFloat(data.longitude)]
        
        setLiveRoute(prevRoute => {
          const updatedRoute = [...prevRoute]
          // Add new position to the route
          updatedRoute.push(newPosition)
          return updatedRoute
        })
      }

      // Update sensor data if available
      const timestamp = data.timestamp || new Date().toLocaleString()
      
      if (data.temperature !== undefined || data.Temp !== undefined) {
        const temperature = data.temperature !== undefined ? 
          parseFloat(data.temperature) : parseFloat(data.Temp)
        
        setTemperatureData(prevData => [
          ...prevData,
          { timestamp, temperature }
        ])
      }

      if (data.humidity !== undefined || data.Hum !== undefined) {
        const humidity = data.humidity !== undefined ? 
          parseFloat(data.humidity) : parseFloat(data.Hum)
        
        setHumidityData(prevData => [
          ...prevData,
          { timestamp, humidity }
        ])
      }

      if (data.battery !== undefined || data.Batt !== undefined) {
        const battery = data.battery !== undefined ? 
          parseFloat(data.battery) : parseFloat(data.Batt)
        
        setBatteryData(prevData => [
          ...prevData,
          { timestamp, battery }
        ])
      }

      if (data.speed !== undefined || data.Speed !== undefined) {
        const speed = data.speed !== undefined ? 
          parseFloat(data.speed) : parseFloat(data.Speed)
        
        setSpeedData(prevData => [
          ...prevData,
          { timestamp, speed }
        ])
      }

      // Update route data for the hover marker functionality
      setRouteData(prevData => [
        ...prevData,
        {
          timestamp,
          latitude: data.latitude,
          longitude: data.longitude,
          temperature: data.temperature || data.Temp,
          humidity: data.humidity || data.Hum,
          battery: data.battery || data.Batt,
          speed: data.speed || data.Speed
        }
      ])
    }
  }

  // Subscribe to tracker updates via WebSocket
  const subscribeToTracker = (trackerId) => {
    if (ws && isConnected) {
      const message = {
        action: 'subscribe',
        trackerId: trackerId
      }
      ws.send(JSON.stringify(message))
    }
  }

  // Unsubscribe from tracker updates via WebSocket
  const unsubscribeFromTracker = (trackerId) => {
    if (ws && isConnected) {
      const message = {
        action: 'unsubscribe',
        trackerId: trackerId
      }
      ws.send(JSON.stringify(message))
    }
  }

  // Initialize WebSocket connection on component mount
  useEffect(() => {
    connectWebSocket()
    
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  // Subscribe/unsubscribe when selected shipment changes
  useEffect(() => {
    if (selectedShipment && isConnected) {
      subscribeToTracker(selectedShipment.trackerId)
    }
    
    return () => {
      if (selectedShipment && isConnected) {
        unsubscribeFromTracker(selectedShipment.trackerId)
      }
    }
  }, [selectedShipment, isConnected, ws])

  const handleShipmentClick = async (shipment) => {
    // Unsubscribe from previous shipment if any
    if (selectedShipment && isConnected) {
      unsubscribeFromTracker(selectedShipment.trackerId)
    }

    setSelectedShipment(shipment)
    setShipmentTab('Sensors')
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
      setLiveRoute([])
      return
    }

    // Fetch initial historical data
    try {
      const params = new URLSearchParams({
        tracker_id: trackerId,
        start: shipDate,
        end: arrivalDate,
        timezone: userTimezone
      })
      const response = await fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_route_data?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRouteData(data)
        
        // Process GPS route data for live route display
        const gpsRoute = data
          .filter(record => record.latitude && record.longitude && 
                          !isNaN(parseFloat(record.latitude)) && 
                          !isNaN(parseFloat(record.longitude)))
          .map(record => [parseFloat(record.latitude), parseFloat(record.longitude)])
        
        setLiveRoute(gpsRoute)
        
        // Process sensor data - timestamps are now in local time
        setTemperatureData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            temperature: record.temperature !== undefined
              ? parseFloat(record.temperature)
              : record.Temp !== undefined
                ? parseFloat(record.Temp)
                : null,
          }))
        )
        setHumidityData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            humidity: record.humidity !== undefined
              ? parseFloat(record.humidity)
              : record.Hum !== undefined
                ? parseFloat(record.Hum)
                : null,
          }))
        )
        setBatteryData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            battery: record.battery !== undefined
              ? parseFloat(record.battery)
              : record.Batt !== undefined
                ? parseFloat(record.Batt)
                : null,
          }))
        )
        setSpeedData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            speed: record.speed !== undefined
              ? parseFloat(record.speed)
              : record.Speed !== undefined
                ? parseFloat(record.Speed)
                : null,
          }))
        )
      } else {
        setRouteData([])
        setLiveRoute([])
        setTemperatureData([])
        setHumidityData([])
        setBatteryData([])
        setSpeedData([])
      }
    } catch (e) {
      setRouteData([])
      setLiveRoute([])
      setTemperatureData([])
      setHumidityData([])
      setBatteryData([])
      setSpeedData([])
    }

    // Subscribe to real-time updates via WebSocket
    if (isConnected) {
      subscribeToTracker(trackerId)
    }
  }

  const handleShipmentSelection = (shipmentId, isSelected) => {
    if (isSelected) {
      setSelectedShipmentsForDeletion(prev => [...prev, shipmentId])
    } else {
      setSelectedShipmentsForDeletion(prev => prev.filter(id => id !== shipmentId))
    }
  }

  const handleSelectAllShipments = (isSelected) => {
    if (isSelected) {
      setSelectedShipmentsForDeletion(filteredShipments.map(s => s._id))
    } else {
      setSelectedShipmentsForDeletion([])
    }
  }

  const deleteSelectedShipments = async () => {
    if (selectedShipmentsForDeletion.length === 0) {
      alert('No shipments selected for deletion.')
      return
    }

    try {
      const deletePromises = selectedShipmentsForDeletion.map(shipmentId =>
        fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_meta/${shipmentId}`, {
          method: 'DELETE'
        })
      )

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(response => response.ok).length
      const failureCount = results.length - successCount

      if (successCount > 0) {
        setShipments(prev => prev.filter(s => !selectedShipmentsForDeletion.includes(s._id)))
        
        // If currently selected shipment was deleted, clear selection
        if (selectedShipment && selectedShipmentsForDeletion.includes(selectedShipment._id)) {
          setSelectedShipment(null)
          setRouteData([])
        }
      }

      setSelectedShipmentsForDeletion([])
      setIsDeleteModalOpen(false)

      if (failureCount === 0) {
        alert(`Successfully deleted ${successCount} shipment${successCount > 1 ? 's' : ''}.`)
      } else {
        alert(`Deleted ${successCount} shipment${successCount > 1 ? 's' : ''}, failed to delete ${failureCount}.`)
      }
    } catch (error) {
      console.error('Error deleting shipments:', error)
      alert('Error occurred while deleting shipments.')
    }
  }

  // Remove the old deleteShipment function and replace with:
  const openDeleteModal = () => {
    if (selectedShipmentsForDeletion.length === 0) {
      alert('Please select shipments to delete.')
      return
    }
    setIsDeleteModalOpen(true)
  }

  // When modal is open and addresses are filled, preview the line
  useEffect(() => {
    const showPreview = async () => {
      if (!isModalOpen) {
        setNewShipmentPreview(null);
        setPreviewMarkers([]);
        setDestinationCoord(null);
        setStartCoord(null);
        return;
      }
      const firstLeg = legs[0];
      const lastLeg = legs[legs.length - 1];
      const from = firstLeg?.shipFromAddress;
      const to = lastLeg?.stopAddress;
      if (from && to && from.trim() !== '' && to.trim() !== '' && from.trim() !== to.trim()) {
        const [fromCoord, toCoord] = await Promise.all([
          geocodeAddress(from),
          geocodeAddress(to),
        ]);
        if (fromCoord && toCoord) {
          setNewShipmentPreview([fromCoord, toCoord]);
          setStartCoord(fromCoord);
          setDestinationCoord(toCoord);
          setPreviewMarkers([
            { position: fromCoord, label: '1', popup: `Start: ${from}` },
            { position: toCoord, label: '2', popup: `End: ${to}` }
          ]);
        } else {
          setNewShipmentPreview(null);
          setPreviewMarkers([]);
          setDestinationCoord(null);
          setStartCoord(null);
        }
      } else {
        setNewShipmentPreview(null);
        setPreviewMarkers([]);
        setDestinationCoord(null);
        setStartCoord(null);
      }
    };
    showPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, legs]);

  // When a shipment is selected, geocode and store all leg coordinates
  useEffect(() => {
    const setCoordsFromShipment = async () => {
      if (
        selectedShipment &&
        selectedShipment.legs &&
        selectedShipment.legs.length > 0
      ) {
        const addresses = [];
        const firstLeg = selectedShipment.legs[0];
        
        // Add ship from address
        if (firstLeg?.shipFromAddress) {
          addresses.push(firstLeg.shipFromAddress);
        }
        
        // Add all stop addresses
        selectedShipment.legs.forEach(leg => {
          if (leg?.stopAddress) {
            addresses.push(leg.stopAddress);
          }
        });
        
        // Geocode all addresses
        const coords = await Promise.all(
          addresses.map(addr => geocodeAddress(addr))
        );
        
        // Filter out null results and create coordinate objects
        const validCoords = coords
          .map((coord, index) => ({
            position: coord,
            address: addresses[index],
            markerNumber: index + 1
          }))
          .filter(item => item.position !== null);
        
        setAllLegCoords(validCoords);
        
        // Set individual coords for backward compatibility
        if (validCoords.length > 0) {
          setStartCoord(validCoords[0].position);
          setDestinationCoord(validCoords[validCoords.length - 1].position);
        } else {
          setStartCoord(null);
          setDestinationCoord(null);
        }
      } else {
        setAllLegCoords([]);
        setStartCoord(null);
        setDestinationCoord(null);
      }
    };
    setCoordsFromShipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShipment]);

  // Show a line between all addresses when a shipment is selected and there is no routeData
  useEffect(() => {
    const showSelectedShipmentLine = async () => {
      if (
        selectedShipment &&
        (!routeData || routeData.length === 0) &&
        selectedShipment.legs &&
        selectedShipment.legs.length > 0
      ) {
        // This effect is now only for setting preview markers, not polylines
        // The polylines are handled by the allLegCoords effect below
        return;
      }
      if (!isModalOpen) {
        setNewShipmentPreview(null);
        setPreviewMarkers([]);
        setDestinationCoord(null);
      }
    };
    showSelectedShipmentLine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShipment, routeData, isModalOpen]);

  // Show all leg markers when shipment is selected
  useEffect(() => {
    if (selectedShipment && allLegCoords.length > 0) {
      // Only set destination coordinate, NO preview markers or polylines
      setDestinationCoord(allLegCoords[allLegCoords.length - 1].position);
      // Clear any preview markers and polylines for selected shipments
      setPreviewMarkers([]);
      setNewShipmentPreview(null);
    } else if (!selectedShipment) {
      setNewShipmentPreview(null);
      setPreviewMarkers([]);
      setDestinationCoord(null);
    }
  }, [selectedShipment, allLegCoords]);

  // ONLY handle modal preview - NO selected shipment logic here
  useEffect(() => {
    if (isModalOpen && newShipmentPreview && newShipmentPreview.length === 2) {
      const from = legs[0]?.shipFromAddress;
      const to = legs[legs.length - 1]?.stopAddress;
      setPreviewMarkers([
        { position: newShipmentPreview[0], label: '1', popup: `Start: ${from}` },
        { position: newShipmentPreview[1], label: '2', popup: `End: ${to}` }
      ]);
      setDestinationCoord(newShipmentPreview[1]);
    } else if (!isModalOpen) {
      // Clear everything when modal closes
      setPreviewMarkers([]);
      if (!selectedShipment) {
        setNewShipmentPreview(null);
        setDestinationCoord(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, newShipmentPreview, legs]);

  // Filter shipments based on search and filters
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = !searchTerm || 
      shipment.trackerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.legs?.[0]?.shipFromAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesShipFrom = !shipFromFilter || 
      shipment.legs?.[0]?.shipFromAddress?.toLowerCase().includes(shipFromFilter.toLowerCase())
    
    const matchesShipTo = !shipToFilter || 
      shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.toLowerCase().includes(shipToFilter.toLowerCase())
    
    return matchesSearch && matchesShipFrom && matchesShipTo
  })

  // Add shipment clustering logic
  useEffect(() => {
    const createShipmentClusters = async () => {
      if (!shipments || shipments.length === 0) {
        setShipmentClusters([])
        return
      }

      setIsLoadingClusters(true)
      
      try {
        // Get unique origin addresses and geocode them
        const originAddresses = [...new Set(
          shipments
            .map(s => s.legs?.[0]?.shipFromAddress)
            .filter(addr => addr && addr.trim() !== '')
        )]

        // Geocode all addresses with progress tracking
        const geocodedAddresses = await Promise.all(
          originAddresses.map(async (address) => {
            const coords = await geocodeAddress(address)
            return { address, coords }
          })
        )

        // Filter out failed geocodes
        const validGeocodes = geocodedAddresses.filter(item => item.coords)

        // Create clusters using a simple distance-based algorithm
        const clusters = []
        const CLUSTER_DISTANCE = 2.0 // degrees (~200km)

        // Use for...of loop instead of forEach to properly handle async/await
        for (const { address, coords } of validGeocodes) {
          // Count shipments for this address
          const shipmentCount = shipments.filter(
            s => s.legs?.[0]?.shipFromAddress === address
          ).length

          // Find existing cluster within distance
          let existingCluster = clusters.find(cluster => {
            const distance = Math.sqrt(
              Math.pow(cluster.lat - coords[0], 2) + 
              Math.pow(cluster.lng - coords[1], 2)
            )
            return distance <= CLUSTER_DISTANCE
          })

          if (existingCluster) {
            // Add to existing cluster
            existingCluster.count += shipmentCount
            existingCluster.addresses.push(address)
            // Update cluster center (weighted average)
            const totalCount = existingCluster.count
            existingCluster.lat = ((existingCluster.lat * (totalCount - shipmentCount)) + (coords[0] * shipmentCount)) / totalCount
            existingCluster.lng = ((existingCluster.lng * (totalCount - shipmentCount)) + (coords[1] * shipmentCount)) / totalCount
          } else {
            // Create new cluster
            const region = await getRegionName(coords[0], coords[1]) // Get region name
            clusters.push({
              id: `cluster-${clusters.length}`,
              lat: coords[0],
              lng: coords[1],
              count: shipmentCount,
              addresses: [address],
              region: region
            })
          }
        }

        setShipmentClusters(clusters)
      } catch (error) {
        console.error('Error creating shipment clusters:', error)
        setShipmentClusters([])
      } finally {
        setIsLoadingClusters(false)
      }
    }

    createShipmentClusters()
  }, [shipments])

  return (
    <div>
      {/* Sidebar */}
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        selectedShipment={selectedShipment}
        setSelectedShipment={setSelectedShipment}
        setIsModalOpen={setIsModalOpen}
        selectedShipmentsForDeletion={selectedShipmentsForDeletion}
        openDeleteModal={openDeleteModal}
        filteredShipments={filteredShipments}
        handleSelectAllShipments={handleSelectAllShipments}
        handleShipmentSelection={handleShipmentSelection}
        handleShipmentClick={handleShipmentClick}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        shipmentTab={shipmentTab}
        setShipmentTab={setShipmentTab}
      />

      {/* Map and other main content here, using helpers as needed */}

      {/* Shipment Creation Modal */}
      <ShipmentModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        legs={legs}
        setLegs={setLegs}
        trackers={trackers}
        selectedTracker={selectedTracker}
        setSelectedTracker={setSelectedTracker}
        addLeg={addLeg}
        submitForm={submitForm}
        isMobile={isMobile}
        handleInputChange={handleInputChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={deleteSelectedShipments}
        selectedCount={selectedShipmentsForDeletion.length}
      />
    </div>
  )
}

export default Shipments