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

  // Add new state for shipment clustering
  const [shipmentClusters, setShipmentClusters] = useState([])
  const [isLoadingClusters, setIsLoadingClusters] = useState(false)

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

  // Helper function to get region name from coordinates
  const getRegionName = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=5&addressdetails=1`
      const response = await fetch(url, { 
        headers: { 'Accept-Language': 'en', 'User-Agent': 'shipment-ui/1.0' } 
      })
      const data = await response.json()
      
      if (data && data.address) {
        // Try to get state/province, then country
        return data.address.state || 
               data.address.province || 
               data.address.region || 
               data.address.country || 
               'Unknown Region'
      }
    } catch (error) {
      console.error('Error getting region name:', error)
    }
    return 'Unknown Region'
  }

  // Create cluster marker icon
  const createClusterIcon = (count, region) => {
    const size = Math.min(60, Math.max(30, 20 + (count * 3))) // Dynamic size based on count
    const color = count >= 10 ? '#d32f2f' : 
                  count >= 5 ? '#f57c00' : 
                  count >= 2 ? '#1976d2' : '#4caf50'
    
    return L.divIcon({
      className: 'shipment-cluster-marker',
      html: `
        <div style="
          background: ${color};
          color: white;
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${count >= 100 ? '14px' : count >= 10 ? '16px' : '18px'};
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          font-family: Arial, sans-serif;
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${count}
        </div>
        <style>
          .shipment-cluster-marker:hover div {
            transform: scale(1.1);
          }
        </style>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2],
    })
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Define a more aggressive way to clear map data
  const safeResetMapData = () => {
    // Clear all coordinates and route data
    setStartCoord(null)
    setDestinationCoord(null)
    setRouteData([])
    setLiveRoute([])
    setNewShipmentPreview(null)
    setPreviewMarkers([])
    setHoverMarker(null)
    
    // Force remount with timestamp to ensure uniqueness
    setMapKey(Date.now())
    setFitWorld(true)
    
    // Double-check that coordinates are nullified with timeout
    setTimeout(() => {
      setStartCoord(null)
      setDestinationCoord(null)
      setPreviewMarkers([])
    }, 50)
  }

  // Let's add a second effect specifically to ensure the destination marker clears
  useEffect(() => {
    if (!selectedShipment && !isModalOpen) {
      // Ensure destination is cleared in next render cycle
      setTimeout(() => {
        setDestinationCoord(null)
        setStartCoord(null)
        setPreviewMarkers([])
      }, 0)
    }
  }, [selectedShipment, isModalOpen])
  
  // Create a function to force clear markers
  const forceClearMarkers = () => {
    setDestinationCoord(null)
    setStartCoord(null)
    setPreviewMarkers([])
    setMapKey(Date.now())
  }

  // And let's also add a custom map component to help clear markers
  function ForceRemoveMarkers({ trigger }) {
    const map = useMap()
    
    useEffect(() => {
      // Try to clear all layers
      if (!selectedShipment && map) {
        map.eachLayer(layer => {
          if (layer instanceof L.Marker) {
            map.removeLayer(layer)
          }
        })
      }
    }, [map, trigger, selectedShipment])
    
    return null
  }

  return (
    <>
      <CRow>
        <CCol xs={12} lg={4} className="order-1 order-lg-0">
          <CCard>
            <CCardHeader>
              <CNav variant="tabs" className="nav-tabs-custom">
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'In Transit'}
                    onClick={() => setActiveTab('In Transit')}
                  >
                    In Transit
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'History'}
                    onClick={() => setActiveTab('History')}
                  >
                    History
                  </CNavLink>
                </CNavItem>
              </CNav>
            </CCardHeader>
            <CCardBody>
              {/* Shipments table */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>
                      <CFormCheck
                        checked={selectedShipmentsForDeletion.length === filteredShipments.length}
                        onChange={(e) => handleSelectAllShipments(e.target.checked)}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>Tracker ID</CTableHeaderCell>
                    <CTableHeaderCell>Ship From</CTableHeaderCell>
                    <CTableHeaderCell>Ship To</CTableHeaderCell>
                    <CTableHeaderCell>Departure</CTableHeaderCell>
                    <CTableHeaderCell>Arrival</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredShipments.map((shipment) => (
                    <CTableRow key={shipment._id}>
                      <CTableDataCell>
                        <CFormCheck
                          checked={selectedShipmentsForDeletion.includes(shipment._id)}
                          onChange={(e) => handleShipmentSelection(shipment._id, e.target.checked)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="link"
                          onClick={() => handleShipmentClick(shipment)}
                          className="p-0"
                        >
                          {shipment.trackerId}
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>{shipment.legs?.[0]?.shipFromAddress}</CTableDataCell>
                      <CTableDataCell>{shipment.legs?.[shipment.legs.length - 1]?.stopAddress}</CTableDataCell>
                      <CTableDataCell>{new Date(shipment.legs?.[0]?.departureDate).toLocaleString()}</CTableDataCell>
                      <CTableDataCell>{new Date(shipment.legs?.[shipment.legs.length - 1]?.arrivalDate).toLocaleString()}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={shipment.status === 'Delivered' ? 'success' : 'warning'}>
                          {shipment.status}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="danger"
                          onClick={() => handleShipmentDelete(shipment._id)}
                          className="btn-icon"
                        >
                          <BsTrash />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {/* No shipments message */}
              {filteredShipments.length === 0 && (
                <CAlert color="info" className="text-center">
                  No shipments found for the selected filters.
                </CAlert>
              )}

              {/* Pagination controls - to be implemented */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <CButton
                  color="primary"
                  onClick={openDeleteModal}
                  disabled={selectedShipmentsForDeletion.length === 0}
                >
                  Delete Selected
                </CButton>
                <div>
                  {/* Placeholder for future pagination controls */}
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} lg={8} className="order-0 order-lg-1 position-relative">
          {/* Map container - now includes our new ForceRemoveMarkers component */}
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
            {/* Add our force marker removal component */}
            {!selectedShipment && <ForceRemoveMarkers trigger={mapKey} />}
            <MapInvalidator sidebarCollapsed={sidebarCollapsed} selectedShipment={selectedShipment} />
            
            {/* Tile layer - using OpenStreetMap as default */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Route polyline - only for selected shipment */}
            {selectedShipment && routeData.length > 0 && (
              <Polyline
                positions={routeData.map((point) => [point.latitude, point.longitude])}
                color="blue"
                weight={4}
                opacity={0.7}
                smoothFactor={1}
              />
            )}

            {/* Live route - dashed line for current location tracking */}
            {selectedShipment && liveRoute.length > 0 && (
              <Polyline
                positions={liveRoute}
                color="red"
                weight={3}
                opacity={0.7}
                dashArray="10, 10"
                smoothFactor={1}
              />
            )}

            {/* Marker for selected shipment's latest location */}
            {selectedShipment && destinationCoord && (
              <Marker
                position={destinationCoord}
                icon={customIcon}
              >
                <Popup>
                  Latest known location
                </Popup>
              </Marker>
            )}

            {/* Always show start and destination markers if available */}
            {startCoord && selectedShipment && (
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
            {destinationCoord && selectedShipment && (
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

            {/* Render shipment clusters if available */}
            {shipmentClusters.length > 0 && shipmentClusters.map((cluster) => (
              <Marker
                key={cluster.id}
                position={[cluster.lat, cluster.lng]}
                icon={createClusterIcon(cluster.count, cluster.region)}
                eventHandlers={{
                  click: () => {
                    // Zoom in on cluster click
                    setMapZoomLevel(8);
                    setMapCenter([cluster.lat, cluster.lng]);
                  },
                }}
              >
                <Popup>
                  {cluster.count} shipment{cluster.count !== 1 ? 's' : ''} from this location.
                  <br />
                  {cluster.addresses.join(', ')}
                </Popup>
              </Marker>
            ))}

            {/* Current location marker - enhanced */}
            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={currentLocationIcon}
              >
                <Popup>
                  You are here
                </Popup>
              </Marker>
            )}

            {/* Sensor data hover marker - if applicable */}
            {hoverMarker && (
              <Marker
                position={hoverMarker}
                icon={hoverMarkerIcon(activeSensor)}
              >
                <Popup>
                  {activeSensor} data point
                </Popup>
              </Marker>
            )}

            {/* Optional: Add a scale control to the map */}
            <div className="leaflet-control-container">
              <div className="leaflet-control-scale leaflet-bar">
                <span className="scale-title">Scale</span>
                <div className="scale-line" />
                <div className="scale-line" />
                <div className="scale-line" />
              </div>
            </div>
          </MapContainer>
        </CCol>
      </CRow>

      {/* Shipment details modal */}
      <CModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <CModalHeader closeButton>
          <CModalTitle>Shipment Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {/* Modal content - to be implemented */}
          <CRow>
            <CCol xs={12} md={6}>
              <h5>Shipment Info</h5>
              <CForm>
                <CFormInput
                  label="Tracker ID"
                  value={selectedShipment?.trackerId || ''}
                  readOnly
                />
                <CFormInput
                  label="Ship From"
                  value={selectedShipment?.legs?.[0]?.shipFromAddress || ''}
                  readOnly
                />
                <CFormInput
                  label="Ship To"
                  value={selectedShipment?.legs?.[selectedShipment.legs.length - 1]?.stopAddress || ''}
                  readOnly
                />
                <CFormInput
                  label="Departure"
                  value={selectedShipment?.legs?.[0]?.departureDate ? new Date(selectedShipment.legs[0].departureDate).toLocaleString() : ''}
                  readOnly
                />
                <CFormInput
                  label="Arrival"
                  value={selectedShipment?.legs?.[selectedShipment.legs.length - 1]?.arrivalDate ? new Date(selectedShipment.legs[selectedShipment.legs.length - 1].arrivalDate).toLocaleString() : ''}
                  readOnly
                />
                <CFormInput
                  label="Status"
                  value={selectedShipment?.status || ''}
                  readOnly
                />
              </CForm>
            </CCol>
            <CCol xs={12} md={6}>
              <h5>Route Data</h5>
              {/* Enhanced route data table */}
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Leg</CTableHeaderCell>
                    <CTableHeaderCell>Mode</CTableHeaderCell>
                    <CTableHeaderCell>Carrier</CTableHeaderCell>
                    <CTableHeaderCell>Departure</CTableHeaderCell>
                    <CTableHeaderCell>Arrival</CTableHeaderCell>
                    <CTableHeaderCell>Duration</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {selectedShipment?.legs?.map((leg, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{index + 1}</CTableDataCell>
                      <CTableDataCell>{leg.mode}</CTableDataCell>
                      <CTableDataCell>{leg.carrier}</CTableDataCell>
                      <CTableDataCell>{new Date(leg.departureDate).toLocaleString()}</CTableDataCell>
                      <CTableDataCell>{new Date(leg.arrivalDate).toLocaleString()}</CTableDataCell>
                      <CTableDataCell>
                        {leg.departureDate && leg.arrivalDate
                          ? `${Math.floor((new Date(leg.arrivalDate) - new Date(leg.departureDate)) / 1000 / 60)} min`
                          : 'N/A'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={leg.status === 'Completed' ? 'success' : 'warning'}>
                          {leg.status}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCol>
          </CRow>

          {/* Sensor data charts - only for selected shipment */}
          {selectedShipment && (
            <CRow className="mt-4">
              <CCol xs={12}>
                <h5>Sensor Data</h5>
                {/* Tab navigation for sensor data */}
                <CNav variant="pills" className="mb-3">
                  <CNavItem>
                    <CNavLink
                      active={shipmentTab === 'Details'}
                      onClick={() => setShipmentTab('Details')}
                    >
                      Details
                    </CNavLink>
                  </CNavItem>
                  <CNavItem>
                    <CNavLink
                      active={shipmentTab === 'Sensors'}
                      onClick={() => setShipmentTab('Sensors')}
                    >
                      Sensors
                    </CNavLink>
                  </CNavItem>
                </CNav>

                {/* Tab content */}
                {shipmentTab === 'Details' && (
                  <CRow>
                    <CCol xs={12} md={6}>
                      <h6>Temperature</h6>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={temperatureData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="temperature" stroke="#ff6b6b" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CCol>
                    <CCol xs={12} md={6}>
                      <h6>Humidity</h6>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={humidityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="humidity" stroke="#4ecdc4" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CCol>
                    <CCol xs={12} md={6}>
                      <h6>Battery</h6>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={batteryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="battery" stroke="#45b7d1" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CCol>
                    <CCol xs={12} md={6}>
                      <h6>Speed</h6>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={speedData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="speed" stroke="#96ceb4" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CCol>
                  </CRow>
                )}

                {shipmentTab === 'Sensors' && (
                  <CRow>
                    <CCol xs={12}>
                      <h6>Live Sensor Data</h6>
                      {/* Enhanced real-time sensor data display */}
                      <CListGroup>
                        {temperatureData.length === 0 && (
                          <CListGroupItem>
                            No temperature data available.
                          </CListGroupItem>
                        )}
                        {temperatureData.map((data, index) => (
                          <CListGroupItem key={index}>
                            <div className="d-flex justify-content-between">
                              <div>
                                <strong>Temperature:</strong> {data.temperature} °C
                              </div>
                              <div>
                                <small className="text-muted">{data.timestamp}</small>
                              </div>
                            </div>
                          </CListGroupItem>
                        ))}
                      </CListGroup>
                    </CCol>
                  </CRow>
                )}
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setIsModalOpen(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete confirmation modal */}
      <CModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <CModalHeader closeButton>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete the selected shipment
          {selectedShipmentsForDeletion.length > 1 ? 's' : ''}?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={deleteSelectedShipments}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Shipments