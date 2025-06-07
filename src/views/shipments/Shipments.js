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
  
  // Add state for shipment counts by state
  const [shipmentsByState, setShipmentsByState] = useState({})
  const [stateCoordinates, setStateCoordinates] = useState({})

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

  const handleShipmentClick = async (shipment) => {
    setSelectedShipment(shipment)
    setShipmentTab('Sensors')  // Changed from 'Details' to 'Sensors'
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
      return
    }

    try {
      const params = new URLSearchParams({
        tracker_id: trackerId,
        start: shipDate,
        end: arrivalDate,
        timezone: userTimezone  // Pass user's timezone to backend
      })
      const response = await fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_route_data?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRouteData(data)
        
        // Process sensor data - timestamps are now in local time
        setTemperatureData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',  // Already in local time
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
        setTemperatureData([])
        setHumidityData([])
        setBatteryData([])
        setSpeedData([])
      }
    } catch (e) {
      setRouteData([])
      setTemperatureData([])
      setHumidityData([])
      setBatteryData([])
      setSpeedData([])
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

  // Address geocode cache to avoid redundant lookups
  const addressCache = {};

  // Helper: Geocode an address to [lat, lng] using Nominatim, with cache
  const geocodeAddress = async (address) => {
    if (!address) return null;
    if (addressCache[address]) return addressCache[address];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'shipment-ui/1.0' } });
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        addressCache[address] = coords;
        return coords;
      }
    } catch (e) {
      // Ignore geocode errors
    }
    return null;
  };

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

  // When a shipment is selected, geocode and store start/destination coords
  useEffect(() => {
    const setCoordsFromShipment = async () => {
      if (
        selectedShipment &&
        selectedShipment.legs &&
        selectedShipment.legs.length > 0
      ) {
        const firstLeg = selectedShipment.legs[0];
        const lastLeg = selectedShipment.legs[selectedShipment.legs.length - 1];
        const from = firstLeg?.shipFromAddress;
        const to = lastLeg?.stopAddress;
        if (from && to && from.trim() !== '' && to.trim() !== '') {
          const [fromCoord, toCoord] = await Promise.all([
            geocodeAddress(from),
            geocodeAddress(to),
          ]);
          setStartCoord(fromCoord);
          setDestinationCoord(toCoord);
        } else {
          setStartCoord(null);
          setDestinationCoord(null);
        }
      } else {
        setStartCoord(null);
        setDestinationCoord(null);
      }
    };
    setCoordsFromShipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShipment]);

  // Show a line between full addresses when a shipment is selected and there is no routeData
  useEffect(() => {
    const showSelectedShipmentLine = async () => {
      if (
        selectedShipment &&
        (!routeData || routeData.length === 0) &&
        selectedShipment.legs &&
        selectedShipment.legs.length > 0
      ) {
        const firstLeg = selectedShipment.legs[0];
        const lastLeg = selectedShipment.legs[selectedShipment.legs.length - 1];
        const from = firstLeg?.shipFromAddress;
        const to = lastLeg?.stopAddress;
        if (from && to && from.trim() !== '' && to.trim() !== '' && from.trim() !== to.trim()) {
          const [fromCoord, toCoord] = await Promise.all([
            geocodeAddress(from),
            geocodeAddress(to),
          ]);
          if (fromCoord && toCoord) {
            setNewShipmentPreview([fromCoord, toCoord]);
            setDestinationCoord(toCoord);
            setPreviewMarkers([
              { position: fromCoord, label: '1', popup: `Start: ${from}` },
              { position: toCoord, label: '2', popup: `End: ${to}` }
            ]);
            return;
          }
        }
      }
      setNewShipmentPreview(null);
      setPreviewMarkers([]);
      setDestinationCoord(null);
    };
    showSelectedShipmentLine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShipment, routeData]);

  // Also update preview markers for modal preview (always use full address)
  useEffect(() => {
    if (isModalOpen && newShipmentPreview && newShipmentPreview.length === 2) {
      const from = legs[0]?.shipFromAddress;
      const to = legs[legs.length - 1]?.stopAddress;
      setPreviewMarkers([
        { position: newShipmentPreview[0], label: '1', popup: `Start: ${from}` },
        { position: newShipmentPreview[1], label: '2', popup: `End: ${to}` }
      ]);
      setDestinationCoord(newShipmentPreview[1]);
    } else if (!isModalOpen && (!selectedShipment || routeData.length > 0)) {
      setPreviewMarkers([]);
      setDestinationCoord(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, newShipmentPreview, legs, selectedShipment, routeData]);

  // Ensure destinationCoord is always set when GPS data is loaded
  useEffect(() => {
    const setDestinationFromShipment = async () => {
      if (
        selectedShipment &&
        routeData.length > 0 &&
        selectedShipment.legs &&
        selectedShipment.legs.length > 0
      ) {
        const lastLeg = selectedShipment.legs[selectedShipment.legs.length - 1];
        const to = lastLeg?.stopAddress;
        if (to && to.trim() !== '') {
          const toCoord = await geocodeAddress(to);
          if (
            Array.isArray(toCoord) &&
            toCoord.length === 2 &&
            !isNaN(toCoord[0]) &&
            !isNaN(toCoord[1])
          ) {
            setDestinationCoord(toCoord);
            return;
          }
        }
      }
      // Only clear if not in preview mode
      if (!isModalOpen) setDestinationCoord(null);
    };
    setDestinationFromShipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShipment, routeData]);

  // Add this effect to subscribe to real-time GPS updates for the selected shipment's tracker
  useEffect(() => {
    if (!selectedShipment || !selectedShipment.trackerId) {
      setLiveRoute([]);
      return;
    }
    // Get the expected time range for the selected shipment
    const legs = selectedShipment.legs || [];
    const firstLeg = legs[0] || {};
    const lastLeg = legs[legs.length - 1] || {};
    const expectedStart = new Date(firstLeg.shipDate);
    const expectedEnd = new Date(lastLeg.arrivalDate);

    let isCurrent = true;

    const ws = new WebSocket('wss://backend-ts-68222fd8cfc0.herokuapp.com/ws');
    ws.onopen = () => {
      // Optionally log or authenticate
    };
    ws.onmessage = (event) => {
      if (!isCurrent) return;
      try {
        const message = JSON.parse(event.data);
        if (
          message.operationType === 'insert' &&
          String(message.tracker_id) === String(selectedShipment.trackerId)
        ) {
          const { geolocation, new_record } = message;
          
          // Use local timestamp if available, otherwise convert UTC
          const timestamp = new_record?.timestamp_local || new_record?.DT || new_record?.timestamp || 'N/A';
          
          // Check if the timestamp is within the expected range (using local time now)
          if (new_record?.timestamp_local) {
            const dt = new Date(new_record.timestamp_local);
            if (isNaN(dt.getTime()) || dt < expectedStart || dt > expectedEnd) {
              return;
            }
          }
          
          const lat = parseFloat(geolocation?.Lat);
          const lng = parseFloat(geolocation?.Lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            setLiveRoute((prevRoute) => {
              const lastPoint = prevRoute[prevRoute.length - 1];
              const newPoint = [lat, lng];
              if (!lastPoint || lastPoint[0] !== lat || lastPoint[1] !== lng) {
                return [...prevRoute, newPoint];
              }
              return prevRoute;
            });
          }
          
          // Update sensor data with local timestamps
          if (new_record) {
            if (new_record.Temp !== undefined) {
              setTemperatureData((prevData) => {
                if (!prevData.some((data) => data.timestamp === timestamp)) {
                  return [
                    ...prevData,
                    { timestamp, temperature: parseFloat(new_record.Temp) },
                  ];
                }
                return prevData;
              });
            }
            if (new_record.Hum !== undefined) {
              setHumidityData((prevData) => {
                if (!prevData.some((data) => data.timestamp === timestamp)) {
                  return [
                    ...prevData,
                    { timestamp, humidity: parseFloat(new_record.Hum) },
                  ];
                }
                return prevData;
              });
            }
            if (new_record.Batt !== undefined) {
              setBatteryData((prevData) => {
                if (!prevData.some((data) => data.timestamp === timestamp)) {
                  return [
                    ...prevData,
                    { timestamp, battery: parseFloat(new_record.Batt) },
                  ];
                }
                return prevData;
              });
            }
            if (new_record.Speed !== undefined) {
              setSpeedData((prevData) => {
                if (!prevData.some((data) => data.timestamp === timestamp)) {
                  return [
                    ...prevData,
                    { timestamp, speed: parseFloat(new_record.Speed) },
                  ];
                }
                return prevData;
              });
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };
    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      isCurrent = false;
      ws.close();
    };
  }, [selectedShipment, userTimezone]);

  // When a shipment is selected, initialize liveRoute from routeData
  useEffect(() => {
    if (routeData && routeData.length > 0) {
      setLiveRoute(
        routeData.map((r) => [parseFloat(r.latitude), parseFloat(r.longitude)])
      );
    } else {
      setLiveRoute([]);
    }
  }, [routeData]);

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

  // Helper to create a number marker icon - Enhanced for better visibility
  const numberIcon = (number) =>
    L.divIcon({
      className: 'number-marker',
      html: `<div style="
        background: #1976d2;
        color: #fff;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        border: 3px solid #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        font-family: Arial, sans-serif;
      ">${number}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    })

  // Enhanced current location marker
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

  // Hover marker icon for sensor data
  const hoverMarkerIcon = (sensorType) => {
    const colors = {
      'Temperature': '#ff6b6b',
      'Humidity': '#4ecdc4',
      'Battery': '#45b7d1',
      'Speed': '#96ceb4'
    };
    const icons = {
      'Temperature': '🌡️',
      'Humidity': '💧',
      'Battery': '🔋',
      'Speed': '⚡'
    };
    
    return L.divIcon({
      className: 'hover-sensor-marker',
      html: `<div style="
        background: ${colors[sensorType] || '#666'};
        color: #fff;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: bounce 0.6s ease-in-out;
      ">${icons[sensorType] || '📍'}</div>
      <style>
        @keyframes bounce {
          0%, 20%, 60%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          80% { transform: translateY(-5px); }
        }
      </style>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const openSidebarToList = () => {
    setSidebarCollapsed(false)
    setSelectedShipment(null) // Always reset to show the shipments list
  }

  // Helper function to find GPS coordinates for a timestamp
  const findCoordinatesForTimestamp = (timestamp) => {
    if (!routeData || routeData.length === 0) return null;
    
    // Find the exact match or closest timestamp
    const exactMatch = routeData.find(record => record.timestamp === timestamp);
    if (exactMatch && exactMatch.latitude && exactMatch.longitude) {
      return [parseFloat(exactMatch.latitude), parseFloat(exactMatch.longitude)];
    }
    
    // If no exact match, find the closest timestamp
    const sortedData = [...routeData].sort((a, b) => 
      Math.abs(new Date(a.timestamp) - new Date(timestamp)) - 
      Math.abs(new Date(b.timestamp) - new Date(timestamp))
    );
    
    const closest = sortedData[0];
    if (closest && closest.latitude && closest.longitude) {
      return [parseFloat(closest.latitude), parseFloat(closest.longitude)];
    }
    
    return null;
  };

  // Handle chart hover events
  const handleChartHover = (data, sensorType) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload;
      const timestamp = payload.timestamp;
      const coordinates = findCoordinatesForTimestamp(timestamp);
      
      if (coordinates) {
        setHoverMarker({
          position: coordinates,
          timestamp: timestamp,
          sensorType: sensorType,
          value: payload[sensorType.toLowerCase()],
          unit: sensorType === 'Temperature' ? '°C' : 
                sensorType === 'Humidity' ? '%' : 
                sensorType === 'Battery' ? '%' : ' km/h'
        });
      }
    } else {
      setHoverMarker(null);
    }
  };

  // Clear hover marker when mouse leaves chart
  const handleChartMouseLeave = () => {
    setHoverMarker(null);
  };

  // Add mapKey and fitWorld state
  const [mapKey, setMapKey] = useState(0)
  const [fitWorld, setFitWorld] = useState(true)

  // When selectedShipment changes, update fitWorld and mapKey
  useEffect(() => {
    if (!selectedShipment) {
      setFitWorld(true)
      setMapKey((k) => k + 1) // force map remount
    } else {
      setFitWorld(false)
    }
  }, [selectedShipment])

  // Helper function to extract state from address
  const extractStateFromAddress = (address) => {
    if (!address) return null
    
    // Common US state patterns in addresses
    const statePatterns = [
      // Full state names
      /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i,
      // State abbreviations
      /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i
    ]
    
    for (const pattern of statePatterns) {
      const match = address.match(pattern)
      if (match) {
        return match[0].toUpperCase()
      }
    }
    
    return null
  }

  // Helper function to normalize state names to abbreviations
  const normalizeStateName = (stateName) => {
    const stateMap = {
      'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
      'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
      'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
      'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
      'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS', 'MISSOURI': 'MO',
      'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
      'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
      'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
      'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT',
      'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY'
    }
    
    return stateMap[stateName.toUpperCase()] || stateName.toUpperCase()
  }

  // US state center coordinates
  const stateCoords = {
    'AL': [32.806671, -86.791130], 'AK': [61.370716, -152.404419], 'AZ': [33.729759, -111.431221],
    'AR': [34.736009, -92.331122], 'CA': [36.116203, -119.681564], 'CO': [39.059811, -105.311104],
    'CT': [41.767, -72.677], 'DE': [39.161921, -75.526755], 'FL': [27.4518, -81.5158],
    'GA': [32.9866, -83.6487], 'HI': [21.1098, -157.5311], 'ID': [44.931109, -116.237651],
    'IL': [40.349457, -88.986137], 'IN': [39.790942, -86.147685], 'IA': [42.032974, -93.581543],
    'KS': [38.572954, -98.580480], 'KY': [37.608621, -84.86311], 'LA': [30.677, -91.867],
    'ME': [45.367584, -68.972168], 'MD': [39.161921, -76.526755], 'MA': [42.2352, -71.0275],
    'MI': [44.182205, -84.506836], 'MN': [46.39241, -94.63623], 'MS': [32.354668, -89.398528],
    'MO': [38.572954, -92.60376], 'MT': [47.052166, -109.633309], 'NE': [41.492537, -99.901813],
    'NV': [38.4199, -117.1219], 'NH': [43.452492, -71.563896], 'NJ': [40.221741, -74.756138],
    'NM': [34.97273, -105.032363], 'NY': [42.659829, -75.615], 'NC': [35.771, -78.638],
    'ND': [47.446, -100.336], 'OH': [40.367474, -82.996216], 'OK': [35.482309, -97.534994],
    'OR': [44.931109, -123.029159], 'PA': [40.269789, -76.875613], 'RI': [41.82355, -71.422132],
    'SC': [33.836082, -81.163727], 'SD': [44.367966, -100.336378], 'TN': [35.746512, -86.068502],
    'TX': [31.106, -97.6475], 'UT': [39.161921, -111.313726], 'VT': [44.26639, -72.5808],
    'VA': [37.54, -78.64], 'WA': [47.042418, -120.893077], 'WV': [38.349497, -80.61991],
    'WI': [44.95, -89.5], 'WY': [42.906847, -107.556085]
  }

  // Count shipments by state when shipments change
  useEffect(() => {
    const countShipmentsByState = () => {
      const stateCounts = {}
      
      shipments.forEach(shipment => {
        // Count origin states
        const originAddress = shipment.legs?.[0]?.shipFromAddress
        if (originAddress) {
          const originState = extractStateFromAddress(originAddress)
          if (originState) {
            const normalizedState = normalizeStateName(originState)
            stateCounts[normalizedState] = (stateCounts[normalizedState] || 0) + 1
          }
        }
        
        // Count destination states
        const destAddress = shipment.legs?.[shipment.legs.length - 1]?.stopAddress
        if (destAddress) {
          const destState = extractStateFromAddress(destAddress)
          if (destState) {
            const normalizedState = normalizeStateName(destState)
            stateCounts[normalizedState] = (stateCounts[normalizedState] || 0) + 1
          }
        }
      })
      
      setShipmentsByState(stateCounts)
    }
    
    countShipmentsByState()
  }, [shipments])

  // Create state marker icon
  const stateMarkerIcon = (count) => {
    const size = Math.min(60, Math.max(30, 20 + count * 3)) // Dynamic size based on count
    const color = count > 10 ? '#ff4444' : count > 5 ? '#ff9800' : '#4CAF50'
    
    return L.divIcon({
      className: 'state-shipment-marker',
      html: `<div style="
        background: ${color};
        color: white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${Math.min(16, 10 + count)}px;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
        animation: pulse-state 2s infinite;
      ">${count}</div>
      <style>
        @keyframes pulse-state {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2],
    })
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
          {/* Mobile Header with Shipment Selection */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px',
            color: 'white',
            flexShrink: 0,
            position: 'relative'
          }}>
            {!selectedShipment ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h5 style={{ margin: 0, fontWeight: '600' }}>Shipments</h5>
                <CButton
                  color="light"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
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
                    onClick={() => setSelectedShipment(null)}
                    style={{ padding: '6px 12px' }}
                  >
                    <BsArrowLeft size={14} />
                  </CButton>
                  <h6 style={{ margin: 0, fontWeight: '600' }}>
                    Shipment #{selectedShipment.trackerId}
                  </h6>
                </div>
              </div>
            )}
          </div>

          {!selectedShipment ? (
            /* Mobile Shipments List */
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
          ) : (
            /* Mobile Selected Shipment View */
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Expandable Shipment Info Card */}
              <div style={{
                background: 'white',
                margin: '12px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <div 
                  onClick={() => setIsShipmentInfoExpanded(!isShipmentInfoExpanded)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isShipmentInfoExpanded ? '1px solid #e9ecef' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                      Shipment Details
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {selectedShipment.legs?.[0]?.shipFromAddress?.substring(0, 25) || 'N/A'}...
                    </div>
                  </div>
                  <div style={{ 
                    transform: isShipmentInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    ▼
                  </div>
                </div>
                
                {isShipmentInfoExpanded && (
                  <div style={{ padding: '16px', fontSize: '13px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>From:</strong> {selectedShipment.legs?.[0]?.shipFromAddress || 'N/A'}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>To:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.stopAddress || 'N/A'}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Departure:</strong> {new Date(selectedShipment.legs?.[0]?.shipDate).toLocaleString() || 'N/A'}
                    </div>
                    <div>
                      <strong>Arrival:</strong> {new Date(selectedShipment.legs?.[selectedShipment.legs.length - 1]?.arrivalDate).toLocaleString() || 'N/A'}
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
                flex: isMapExpanded ? 1 : '0 0 250px',
                transition: 'flex 0.3s ease'
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
                    Route Map
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    {isMapExpanded ? 'Collapse ⬇️' : 'Expand ⬆️'}
                  </div>
                </div>
                
                <div style={{ height: isMapExpanded ? 'calc(100% - 48px)' : '202px' }}>
                  <MapContainer
                    key={mapKey}
                    center={[42.798939, -74.658409]}
                    zoom={5}
                    minZoom={3}
                    style={{ height: '100%', width: '100%' }}
                    className="custom-map-container"
                    zoomControl={true}
                    attributionControl={true}
                  >
                    {/* Fit world if on list */}
                    {fitWorld && <FitWorld trigger={mapKey} />}
                    <MapInvalidator sidebarCollapsed={false} selectedShipment={isMapExpanded} />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Always show start and destination markers if available */}
                    {startCoord && (
                      <Marker position={startCoord} icon={numberIcon('1')}>
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <strong>🚀 Departure Point</strong><br/>
                            {selectedShipment?.legs?.[0]?.shipFromAddress || legs[0]?.shipFromAddress}
                            <br/><small>Start of shipment journey</small>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {destinationCoord && (
                      <Marker position={destinationCoord} icon={numberIcon('2')}>
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <strong>🏁 Destination Point</strong><br/>
                            {selectedShipment?.legs?.[selectedShipment.legs.length - 1]?.stopAddress || legs[legs.length - 1]?.stopAddress}
                            <br/><small>End of shipment journey</small>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Enhanced shipment route display */}
                    {liveRoute.length > 0 ? (
                      <>
                        {/* Fit map to show the entire route */}
                        <FitBounds route={[...liveRoute, ...(destinationCoord ? [destinationCoord] : [])]} />
                        
                        {/* Solid blue line showing the actual GPS route taken */}
                        <Polyline 
                          positions={liveRoute} 
                          color="#2196f3" 
                          weight={4}
                          opacity={0.8}
                        />
                        
                        {/* Dashed line from last GPS point to destination (if not at destination) */}
                        {destinationCoord && liveRoute.length > 0 && (
                          (() => {
                            const lastGpsPoint = liveRoute[liveRoute.length - 1];
                            const destLat = destinationCoord[0];
                            const destLng = destinationCoord[1];
                            const lastLat = lastGpsPoint[0];
                            const lastLng = lastGpsPoint[1];
                            
                            // Only show dashed line if current location is not at destination
                            const distanceThreshold = 0.001; // ~100 meters
                            const isAtDestination = Math.abs(lastLat - destLat) < distanceThreshold && 
                                                  Math.abs(lastLng - destLng) < distanceThreshold;
                            
                            if (!isAtDestination) {
                              return (
                                <Polyline
                                  positions={[lastGpsPoint, destinationCoord]}
                                  color="#ff9800"
                                  weight={3}
                                  opacity={0.7}
                                  dashArray="10, 10"
                                />
                              );
                            }
                            return null;
                          })()
                        )}
                        
                        {/* Current location marker with enhanced styling */}
                        <Marker position={liveRoute[liveRoute.length - 1]} icon={currentLocationIcon}>
                          <Popup>
                            <div style={{ minWidth: '200px' }}>
                              <strong>📍 Current Location</strong><br/>
                              <small>Lat: {liveRoute[liveRoute.length - 1][0].toFixed(6)}</small><br/>
                              <small>Lng: {liveRoute[liveRoute.length - 1][1].toFixed(6)}</small><br/>
                              <small>Last updated: {new Date().toLocaleTimeString()}</small>
                            </div>
                          </Popup>
                        </Marker>
                      </>
                    ) : (
                      // Show dashed line between start and destination when no GPS data yet
                      startCoord && destinationCoord && (
                        <Polyline 
                          positions={[startCoord, destinationCoord]} 
                          color="#9e9e9e" 
                          weight={3}
                          opacity={0.6}
                          dashArray="15, 15" 
                        />
                      )
                    )}

                    {/* State shipment count markers - only show when no specific shipment is selected */}
                    {!selectedShipment && Object.entries(shipmentsByState).map(([state, count]) => {
                      const coords = stateCoords[state]
                      if (!coords || count === 0) return null
                      
                      return (
                        <Marker
                          key={`state-${state}`}
                          position={coords}
                          icon={stateMarkerIcon(count)}
                        >
                          <Popup>
                            <div style={{ minWidth: '200px', textAlign: 'center' }}>
                              <strong>📊 {state} Shipments</strong><br/>
                              <div style={{ 
                                fontSize: '24px', 
                                fontWeight: 'bold', 
                                color: '#2196f3',
                                margin: '8px 0'
                              }}>
                                {count}
                              </div>
                              <small>
                                Total shipments involving {state}
                                <br/>
                                (origins + destinations)
                              </small>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    })}

                    {/* Hover marker for sensor data */}
                    {hoverMarker && (
                      <Marker 
                        position={hoverMarker.position} 
                        icon={hoverMarkerIcon(hoverMarker.sensorType)}
                      >
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <strong>{hoverMarker.sensorType} Reading</strong><br/>
                            <strong>Value:</strong> {hoverMarker.value}{hoverMarker.unit}<br/>
                            <strong>Time:</strong> {hoverMarker.timestamp}<br/>
                            <strong>Location:</strong><br/>
                            <small>Lat: {hoverMarker.position[0].toFixed(6)}</small><br/>
                            <small>Lng: {hoverMarker.position[1].toFixed(6)}</small>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* Mobile Bottom Navigation */}
              <div style={{
                background: 'white',
                borderTop: '1px solid #e9ecef',
                padding: '8px 0',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  {[
                    { key: 'Sensors', icon: BsThermometerHalf, label: 'Sensors' },
                    { key: 'Alerts', icon: BsExclamationTriangle, label: 'Alerts' },
                    { key: 'Reports', icon: BsFileText, label: 'Reports' }
                  ].map(({ key, icon: Icon, label }) => (
                    <div
                      key={key}
                      onClick={() => setShipmentTab(key)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        color: shipmentTab === key ? '#1976d2' : '#666',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                    >
                      <Icon size={18} style={{ marginBottom: '4px' }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Tab Content */}
              {shipmentTab === 'Sensors' && (
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  flex: 1,
                  overflow: 'auto'
                }}>
                  {/* Horizontal Scrolling Sensor Tabs */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                    overflowX: 'auto',
                    paddingBottom: '8px'
                  }}>
                    {[
                      { key: 'Temperature', icon: '🌡️', color: '#ff6b6b' },
                      { key: 'Humidity', icon: '💧', color: '#4ecdc4' },
                      { key: 'Battery', icon: '🔋', color: '#45b7d1' },
                      { key: 'Speed', icon: '⚡', color: '#96ceb4' }
                    ].map(({ key, icon, color }) => (
                      <div
                        key={key}
                        onClick={() => setMobileSensorTab(key)}
                        style={{
                          background: mobileSensorTab === key ? color : 'white',
                          color: mobileSensorTab === key ? 'white' : '#666',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          minWidth: 'fit-content'
                        }}
                      >
                        <span>{icon}</span>
                        {key}
                      </div>
                    ))}
                  </div>

                  {/* Current Sensor Chart */}
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px 0 16px 16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <h6 style={{ 
                      margin: '0 16px 16px 0', 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {mobileSensorTab === 'Temperature' && <BsThermometerHalf style={{ color: '#ff6b6b' }} />}
                      {mobileSensorTab === 'Humidity' && <BsDroplet style={{ color: '#4ecdc4' }} />}
                      {mobileSensorTab === 'Battery' && <BsBatteryHalf style={{ color: '#45b7d1' }} />}
                      {mobileSensorTab === 'Speed' && <BsSpeedometer2 style={{ color: '#96ceb4' }} />}
                      {mobileSensorTab}
                    </h6>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart 
                        data={
                          mobileSensorTab === 'Temperature' ? temperatureData :
                          mobileSensorTab === 'Humidity' ? humidityData :
                          mobileSensorTab === 'Battery' ? batteryData :
                          speedData
                        }
                        margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                        onMouseMove={(data) => handleChartHover(data, mobileSensorTab)}
                        onMouseLeave={handleChartMouseLeave}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" tick={false} />
                        <YAxis fontSize={10} width={35} />
                        <Tooltip
                          formatter={(value) => [
                            `${value}${
                              mobileSensorTab === 'Temperature' ? '°C' :
                              mobileSensorTab === 'Humidity' ? '%' :
                              mobileSensorTab === 'Battery' ? '%' : ' km/h'
                            }`, 
                            mobileSensorTab
                          ]}
                          labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={
                            mobileSensorTab === 'Temperature' ? 'temperature' :
                            mobileSensorTab === 'Humidity' ? 'humidity' :
                            mobileSensorTab === 'Battery' ? 'battery' :
                            'speed'
                          }
                          stroke={
                            mobileSensorTab === 'Temperature' ? '#ff6b6b' :
                            mobileSensorTab === 'Humidity' ? '#4ecdc4' :
                            mobileSensorTab === 'Battery' ? '#45b7d1' :
                            '#96ceb4'
                          }
                          strokeWidth={2} 
                          dot={false} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {shipmentTab === 'Alerts' && (
                <div style={{ 
                  background: '#f8f9fa',
                  padding: '40px 20px', 
                  textAlign: 'center', 
                  color: '#666',
                  flex: 1
                }}>
                  <BsExclamationTriangle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '14px' }}>No alerts for this shipment</div>
                </div>
              )}
              
              {shipmentTab === 'Reports' && (
                <div style={{ 
                  background: '#f8f9fa',
                  padding: '40px 20px', 
                  textAlign: 'center', 
                  color: '#666',
                  flex: 1
                }}>
                  <BsFileText size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '14px' }}>Reports feature coming soon</div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Desktop Layout - Keep existing sidebar + map structure */
        <>
          {/* Sidebar */}
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
            {/* Sidebar Content - Only show when not collapsed */}
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
                      
                      {/* Shipment Details Summary */}
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

                {/* Sidebar Content */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {!selectedShipment ? (
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
                                {/* Checkbox for selection */}
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
                                
                                {/* Shipment Content */}
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
                      {/* Shipment Detail Tabs */}
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

                      {/* Tab Content */}
                      <div style={{ 
                        flex: 1, 
                        overflow: 'auto', 
                        padding: '8px 0',
                        WebkitOverflowScrolling: 'touch'
                      }}>
                        {shipmentTab === 'Sensors' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Temperature Chart */}
                            <div style={{ 
                              border: '1px solid #e9ecef',
                              margin: '0 16px',
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
                                <BsThermometerHalf style={{ marginRight: '8px', color: '#ff6b6b' }} />
                                Temperature
                              </div>
                              <div style={{ padding: '0' }}>
                                <ResponsiveContainer width="100%" height={180}>
                                  <LineChart 
                                    data={temperatureData}
                                    margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                                    onMouseMove={(data) => handleChartHover(data, 'Temperature')}
                                    onMouseLeave={handleChartMouseLeave}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" tick={false} />
                                    <YAxis fontSize={10} width={40} />
                                    <Tooltip
                                      formatter={(value) => [`${value}°C`, 'Temperature']}
                                      labelFormatter={(label) => `Time: ${label}`}
                                    />
                                    <Line type="monotone" dataKey="temperature" stroke="#ff6b6b" strokeWidth={2} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Humidity Chart */}
                            <div style={{ 
                              border: '1px solid #e9ecef',
                              margin: '0 16px',
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
                                <BsDroplet style={{ marginRight: '8px', color: '#4ecdc4' }} />
                                Humidity
                              </div>
                              <div style={{ padding: '0' }}>
                                <ResponsiveContainer width="100%" height={180}>
                                  <LineChart 
                                    data={humidityData}
                                    margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                                    onMouseMove={(data) => handleChartHover(data, 'Humidity')}
                                    onMouseLeave={handleChartMouseLeave}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" tick={false} />
                                    <YAxis fontSize={10} width={40} />
                                    <Tooltip
                                      formatter={(value) => [`${value}%`, 'Humidity']}
                                      labelFormatter={(label) => `Time: ${label}`}
                                    />
                                    <Line type="monotone" dataKey="humidity" stroke="#4ecdc4" strokeWidth={2} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Battery Chart */}
                            <div style={{ 
                              border: '1px solid #e9ecef',
                              margin: '0 16px',
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
                                <BsBatteryHalf style={{ marginRight: '8px', color: '#45b7d1' }} />
                                Battery Level
                              </div>
                              <div style={{ padding: '0' }}>
                                <ResponsiveContainer width="100%" height={180}>
                                  <LineChart 
                                    data={batteryData}
                                    margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                                    onMouseMove={(data) => handleChartHover(data, 'Battery')}
                                    onMouseLeave={handleChartMouseLeave}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" tick={false} />
                                    <YAxis fontSize={10} width={40} />
                                    <Tooltip
                                      formatter={(value) => [`${value}%`, 'Battery']}
                                      labelFormatter={(label) => `Time: ${label}`}
                                    />
                                    <Line type="monotone" dataKey="battery" stroke="#45b7d1" strokeWidth={2} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Speed Chart */}
                            <div style={{ 
                              border: '1px solid #e9ecef',
                              margin: '0 16px',
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
                                <BsSpeedometer2 style={{ marginRight: '8px', color: '#96ceb4' }} />
                                Speed
                              </div>
                              <div style={{ padding: '0' }}>
                                <ResponsiveContainer width="100%" height={180}>
                                  <LineChart 
                                    data={speedData}
                                    margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                                    onMouseMove={(data) => handleChartHover(data, 'Speed')}
                                    onMouseLeave={handleChartMouseLeave}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" tick={false} />
                                    <YAxis fontSize={10} width={40} />
                                    <Tooltip
                                      formatter={(value) => [`${value} km/h`, 'Speed']}
                                      labelFormatter={(label) => `Time: ${label}`}
                                    />
                                    <Line type="monotone" dataKey="speed" stroke="#96ceb4" strokeWidth={2} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {shipmentTab === 'Alerts' && (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '40px 20px', 
                            color: '#666',
                            fontSize: '14px'
                          }}>
                            <BsExclamationTriangle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <div>No alerts for this shipment</div>
                          </div>
                        )}
                        
                        {shipmentTab === 'Reports' && (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '40px 20px', 
                            color: '#666',
                            fontSize: '14px'
                          }}>
                            <BsFileText size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <div>Reports feature coming soon</div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Toggle Button - Always visible and properly positioned */}
          <div style={{
            position: 'fixed',
            top: '60px',
            left: sidebarCollapsed 
              ? '20px' 
              : (selectedShipment ? '470px' : '420px'),
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

            {/* Selected Shipment Info - Show when shipment selected and sidebar collapsed */}
            {sidebarCollapsed && selectedShipment && (
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
                      Shipment #{selectedShipment.trackerId}
                    </h6>
                    <CBadge color="primary" style={{ fontSize: '10px' }}>
                      In Transit
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
                    <strong>From:</strong> {selectedShipment.legs?.[0]?.shipFromAddress?.substring(0, 30) || 'N/A'}
                    {selectedShipment.legs?.[0]?.shipFromAddress?.length > 30 ? '...' : ''}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>To:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.stopAddress?.substring(0, 30) || 'N/A'}
                    {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.stopAddress?.length > 30 ? '...' : ''}
                  </div>
                  <div>
                    <strong>ETA:</strong> {new Date(selectedShipment.legs?.[selectedShipment.legs.length - 1]?.arrivalDate).toLocaleDateString() || 'N/A'}
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
              key={mapKey}
              center={[42.798939, -74.658409]}
              zoom={5}
              minZoom={3}
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
              {/* Fit world if on list */}
              {fitWorld && <FitWorld trigger={mapKey} />}
              <MapInvalidator sidebarCollapsed={sidebarCollapsed} selectedShipment={selectedShipment} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Always show start and destination markers if available */}
              {startCoord && (
                <Marker position={startCoord} icon={numberIcon('1')}>
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <strong>🚀 Departure Point</strong><br/>
                      {selectedShipment?.legs?.[0]?.shipFromAddress || legs[0]?.shipFromAddress}
                      <br/><small>Start of shipment journey</small>
                    </div>
                  </Popup>
                </Marker>
              )}
              {destinationCoord && (
                <Marker position={destinationCoord} icon={numberIcon('2')}>
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <strong>🏁 Destination Point</strong><br/>
                      {selectedShipment?.legs?.[selectedShipment.legs.length - 1]?.stopAddress || legs[legs.length - 1]?.stopAddress}
                      <br/><small>End of shipment journey</small>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Enhanced shipment route display */}
              {liveRoute.length > 0 ? (
                <>
                  {/* Fit map to show the entire route */}
                  <FitBounds route={[...liveRoute, ...(destinationCoord ? [destinationCoord] : [])]} />
                  
                  {/* Solid blue line showing the actual GPS route taken */}
                  <Polyline 
                    positions={liveRoute} 
                    color="#2196f3" 
                    weight={4}
                    opacity={0.8}
                  />
                  
                  {/* Dashed line from last GPS point to destination (if not at destination) */}
                  {destinationCoord && liveRoute.length > 0 && (
                    (() => {
                      const lastGpsPoint = liveRoute[liveRoute.length - 1];
                      const destLat = destinationCoord[0];
                      const destLng = destinationCoord[1];
                      const lastLat = lastGpsPoint[0];
                      const lastLng = lastGpsPoint[1];
                      
                      // Only show dashed line if current location is not at destination
                      const distanceThreshold = 0.001; // ~100 meters
                      const isAtDestination = Math.abs(lastLat - destLat) < distanceThreshold && 
                                            Math.abs(lastLng - destLng) < distanceThreshold;
                      
                      if (!isAtDestination) {
                        return (
                          <Polyline
                            positions={[lastGpsPoint, destinationCoord]}
                            color="#ff9800"
                            weight={3}
                            opacity={0.7}
                            dashArray="10, 10"
                          />
                        );
                      }
                      return null;
                    })()
                  )}
                  
                  {/* Current location marker with enhanced styling */}
                  <Marker position={liveRoute[liveRoute.length - 1]} icon={currentLocationIcon}>
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <strong>📍 Current Location</strong><br/>
                        <small>Lat: {liveRoute[liveRoute.length - 1][0].toFixed(6)}</small><br/>
                        <small>Lng: {liveRoute[liveRoute.length - 1][1].toFixed(6)}</small><br/>
                        <small>Last updated: {new Date().toLocaleTimeString()}</small>
                      </div>
                    </Popup>
                  </Marker>
                </>
              ) : (
                // Show dashed line between start and destination when no GPS data yet
                startCoord && destinationCoord && (
                  <Polyline 
                    positions={[startCoord, destinationCoord]} 
                    color="#9e9e9e" 
                    weight={3}
                    opacity={0.6}
                    dashArray="15, 15" 
                  />
                )
              )}

              {/* State shipment count markers - only show when no specific shipment is selected */}
              {!selectedShipment && Object.entries(shipmentsByState).map(([state, count]) => {
                const coords = stateCoords[state]
                if (!coords || count === 0) return null
                
                return (
                  <Marker
                    key={`state-${state}`}
                    position={coords}
                    icon={stateMarkerIcon(count)}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px', textAlign: 'center' }}>
                        <strong>📊 {state} Shipments</strong><br/>
                        <div style={{ 
                          fontSize: '24px', 
                          fontWeight: 'bold', 
                          color: '#2196f3',
                          margin: '8px 0'
                        }}>
                          {count}
                        </div>
                        <small>
                          Total shipments involving {state}
                          <br/>
                          (origins + destinations)
                        </small>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

              {/* Hover marker for sensor data */}
              {hoverMarker && (
                <Marker 
                  position={hoverMarker.position} 
                  icon={hoverMarkerIcon(hoverMarker.sensorType)}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <strong>{hoverMarker.sensorType} Reading</strong><br/>
                      <strong>Value:</strong> {hoverMarker.value}{hoverMarker.unit}<br/>
                      <strong>Time:</strong> {hoverMarker.timestamp}<br/>
                      <strong>Location:</strong><br/>
                      <small>Lat: {hoverMarker.position[0].toFixed(6)}</small><br/>
                      <small>Lng: {hoverMarker.position[1].toFixed(6)}</small>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Map Info Panel - Show when no shipment selected and sidebar collapsed */}
            {sidebarCollapsed && !selectedShipment && (
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
                  Shipment Tracking
                </h6>
                <p style={{ margin: 0, fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  Open the sidebar to view and manage shipments
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
                  View Shipments
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
              Delete {selectedShipmentsForDeletion.length} Shipment{selectedShipmentsForDeletion.length > 1 ? 's' : ''}?
            </h6>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              This action cannot be undone. The selected shipment{selectedShipmentsForDeletion.length > 1 ? 's' : ''} will be permanently removed from the system.
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
              onClick={deleteSelectedShipments}
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

      {/* Enhanced Modal - Make responsive */}
      <CModal 
        visible={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
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
              onClick={() => setIsModalOpen(false)}
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
    </div>
  )
}

export default Shipments