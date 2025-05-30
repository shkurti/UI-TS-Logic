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
    setShipmentTab('Details')
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
      })
      const response = await fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_route_data?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRouteData(data)
        // Populate sensor data for tabs using the correct field names from backend
        setTemperatureData(
          data.map((record) => ({
            timestamp: record.timestamp || record.DT || 'N/A',
            temperature: record.temperature !== undefined
              ? parseFloat(record.temperature)
              : record.Temp !== undefined
                ? parseFloat(record.Temp)
                : null,
          }))
        )
        setHumidityData(
          data.map((record) => ({
            timestamp: record.timestamp || record.DT || 'N/A',
            humidity: record.humidity !== undefined
              ? parseFloat(record.humidity)
              : record.Hum !== undefined
                ? parseFloat(record.Hum)
                : null,
          }))
        )
        setBatteryData(
          data.map((record) => ({
            timestamp: record.timestamp || record.DT || 'N/A',
            battery: record.battery !== undefined
              ? parseFloat(record.battery)
              : record.Batt !== undefined
                ? parseFloat(record.Batt)
                : null,
          }))
        )
        setSpeedData(
          data.map((record) => ({
            timestamp: record.timestamp || record.DT || 'N/A',
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
          // Check if the new_record timestamp is within the expected range
          const dtString = new_record?.DT || new_record?.timestamp;
          if (dtString) {
            const dt = new Date(dtString);
            if (isNaN(dt.getTime()) || dt < expectedStart || dt > expectedEnd) {
              return; // Ignore data outside the shipment's time window
            }
          } else {
            return; // Ignore if no timestamp
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
          // Update sensor data in real time using new_record fields (Temp, Hum, Batt, Speed, DT)
          if (new_record) {
            const timestamp = new_record.DT || new_record.timestamp || 'N/A';
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
  }, [selectedShipment]);

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

  // Helper to create a number marker icon
  const numberIcon = (number) =>
    L.divIcon({
      className: 'number-marker',
      html: `<div style="
        background: #1976d2;
        color: #fff;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        border: 2px solid #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      ">${number}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    })

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const openSidebarToList = () => {
    setSidebarCollapsed(false)
    setSelectedShipment(null) // Always reset to show the shipments list
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 120px)', // Subtract navbar height
      width: '100vw',
      overflow: 'hidden',
      position: 'fixed',
      top: '40px', // Position below navbar
      left: 0,
      margin: 0,
      padding: 0,
      zIndex: 1
    }}>
      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <div 
          style={{
            position: 'fixed',
            top: '120px', // Start below navbar
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed 
          ? '0px' 
          : selectedShipment 
            ? (isMobile ? '100vw' : '450px') 
            : (isMobile ? '100vw' : '400px'),
        background: '#fff',
        boxShadow: sidebarCollapsed ? 'none' : '2px 0 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        transition: 'width 0.3s ease, box-shadow 0.3s ease',
        position: 'relative',
        height: 'calc(100vh - 120px)', // Adjust for navbar
        overflow: 'hidden',
        flexShrink: 0
      }}>
        {/* Sidebar Content - Only show when not collapsed */}
        {!sidebarCollapsed && (
          <>
            {/* Sidebar Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: isMobile ? '60px 20px 20px 20px' : '20px',
              color: 'white',
              position: 'relative',
              flexShrink: 0
            }}>
              {/* Close button for mobile */}
              {isMobile && (
                <CButton
                  color="light"
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarCollapsed(true)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '6px 12px',
                    zIndex: 1002
                  }}
                >
                  ✕
                </CButton>
              )}

              {!selectedShipment ? (
                <>
                  <h4 style={{ 
                    margin: 0, 
                    marginBottom: '8px', 
                    fontWeight: '700',
                    fontSize: isMobile ? '1.2rem' : '1.5rem'
                  }}>
                    Shipment Management
                  </h4>
                  <p style={{ 
                    margin: 0, 
                    opacity: 0.9, 
                    fontSize: isMobile ? '12px' : '14px'
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
                      fontSize: isMobile ? '1rem' : '1.25rem'
                    }}>
                      Shipment #{selectedShipment.trackerId}
                    </h5>
                  </div>
                  
                  {/* Shipment Details Summary */}
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: isMobile ? '8px' : '12px',
                    fontSize: isMobile ? '11px' : '13px'
                  }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>From:</strong> {selectedShipment.legs?.[0]?.shipFromAddress?.substring(0, isMobile ? 25 : 35) || 'N/A'}
                      {selectedShipment.legs?.[0]?.shipFromAddress?.length > (isMobile ? 25 : 35) ? '...' : ''}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>To:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.stopAddress?.substring(0, isMobile ? 25 : 35) || 'N/A'}
                      {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.stopAddress?.length > (isMobile ? 25 : 35) ? '...' : ''}
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
                    padding: isMobile ? '12px' : '16px', 
                    borderBottom: '1px solid #e9ecef',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: '8px', 
                      marginBottom: '16px' 
                    }}>
                      <CButton
                        color="primary"
                        onClick={() => setIsModalOpen(true)
                        }
                        style={{
                          flex: 1,
                          borderRadius: '8px',
                          padding: '10px',
                          fontWeight: '600',
                          fontSize: isMobile ? '12px' : '14px'
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
                          flex: isMobile ? 1 : 'auto',
                          fontSize: isMobile ? '12px' : '14px'
                        }}
                      >
                        <BsTrash size={14} />
                        {isMobile ? (
                          <span style={{ marginLeft: '6px' }}>
                            Delete ({selectedShipmentsForDeletion.length})
                          </span>
                        ) : (
                          selectedShipmentsForDeletion.length > 0 && (
                            <span style={{ marginLeft: '6px' }}>
                              ({selectedShipmentsForDeletion.length})
                            </span>
                          )
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
                        fontSize: isMobile ? '12px' : '14px',
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
                    <CInputGroup size={isMobile ? 'sm' : 'sm'}>
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
                    WebkitOverflowScrolling: 'touch' // Enable smooth scrolling on iOS
                  }}>
                    <CListGroup flush>
                      {filteredShipments.map((shipment, index) => (
                        <CListGroupItem
                          key={index}
                          style={{
                            border: 'none',
                            borderBottom: '1px solid #f0f0f0',
                            padding: isMobile ? '12px' : '16px',
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
                                    fontSize: isMobile ? '12px' : '14px'
                                  }}>
                                    #{shipment.trackerId}
                                  </strong>
                                  <CBadge color="primary" style={{ fontSize: isMobile ? '8px' : '10px' }}>
                                    In Transit
                                  </CBadge>
                                </div>
                              </div>
                              
                              <div style={{ 
                                fontSize: isMobile ? '10px' : '12px', 
                                color: '#666', 
                                lineHeight: '1.4' 
                              }}>
                                <div style={{ marginBottom: '4px' }}>
                                  <strong>From:</strong> {shipment.legs?.[0]?.shipFromAddress?.substring(0, isMobile ? 20 : 25) || 'N/A'}
                                  {shipment.legs?.[0]?.shipFromAddress?.length > (isMobile ? 20 : 25) ? '...' : ''}
                                </div>
                                <div style={{ marginBottom: '4px' }}>
                                  <strong>To:</strong> {shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.substring(0, isMobile ? 20 : 25) || 'N/A'}
                                  {shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.length > (isMobile ? 20 : 25) ? '...' : ''}
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
                        padding: isMobile ? '20px' : '40px 20px', 
                        color: '#666',
                        fontSize: isMobile ? '12px' : '14px'
                      }}>
                        <BsInfoCircle size={isMobile ? 20 : 24} style={{ marginBottom: '12px', opacity: 0.5 }} />
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
                    padding: isMobile ? '0 12px' : '0 16px',
                    flexShrink: 0
                  }}>
                    <CNav variant="pills" style={{ 
                      gap: '4px', 
                      padding: isMobile ? '8px 0' : '12px 0',
                      flexWrap: 'wrap'
                    }}>
                      {['Sensors', 'Alerts', 'Reports'].map((tab) => (
                        <CNavItem key={tab}>
                          <CNavLink
                            active={shipmentTab === tab}
                            onClick={() => setShipmentTab(tab)}
                            style={{
                              borderRadius: '6px',
                              padding: isMobile ? '6px 8px' : '8px 12px',
                              fontSize: isMobile ? '11px' : '13px',
                              fontWeight: '500',
                              background: shipmentTab === tab ? '#e3f2fd' : 'transparent',
                              color: shipmentTab === tab ? '#1976d2' : '#666'
                            }}
                          >
                            {tab === 'Sensors' && <BsThermometerHalf size={isMobile ? 12 : 14} style={{ marginRight: '4px' }} />}
                            {tab === 'Alerts' && <BsExclamationTriangle size={isMobile ? 12 : 14} style={{ marginRight: '4px' }} />}
                            {tab === 'Reports' && <BsFileText size={isMobile ? 12 : 14} style={{ marginRight: '4px' }} />}
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
                    padding: isMobile ? '12px' : '16px',
                    WebkitOverflowScrolling: 'touch' // Enable smooth scrolling on iOS
                  }}>
                    {shipmentTab === 'Sensors' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
                        {/* Temperature Chart */}
                        <CCard style={{ border: '1px solid #e9ecef' }}>
                          <CCardHeader style={{ 
                            padding: isMobile ? '8px 12px' : '12px 16px', 
                            background: '#f8f9fa', 
                            fontSize: isMobile ? '12px' : '14px', 
                            fontWeight: '600' 
                          }}>
                            <BsThermometerHalf style={{ marginRight: '8px', color: '#ff6b6b' }} />
                            Temperature
                          </CCardHeader>
                          <CCardBody style={{ padding: isMobile ? '8px' : '12px' }}>
                            <ResponsiveContainer width="100%" height={isMobile ? 120 : 180}>
                              <LineChart data={temperatureData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" tick={false} />
                                <YAxis fontSize={isMobile ? 8 : 10} />
                                <Tooltip
                                  formatter={(value) => [`${value}°C`, 'Temperature']}
                                  labelFormatter={(label) => `Time: ${label}`}
                                />
                                <Line type="monotone" dataKey="temperature" stroke="#ff6b6b" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CCardBody>
                        </CCard>

                        {/* Humidity Chart */}
                        <CCard style={{ border: '1px solid #e9ecef' }}>
                          <CCardHeader style={{ 
                            padding: isMobile ? '8px 12px' : '12px 16px', 
                            background: '#f8f9fa', 
                            fontSize: isMobile ? '12px' : '14px', 
                            fontWeight: '600' 
                          }}>
                            <BsDroplet style={{ marginRight: '8px', color: '#4ecdc4' }} />
                            Humidity
                          </CCardHeader>
                          <CCardBody style={{ padding: isMobile ? '8px' : '12px' }}>
                            <ResponsiveContainer width="100%" height={isMobile ? 120 : 180}>
                              <LineChart data={humidityData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" tick={false} />
                                <YAxis fontSize={isMobile ? 8 : 10} />
                                <Tooltip
                                  formatter={(value) => [`${value}%`, 'Humidity']}
                                  labelFormatter={(label) => `Time: ${label}`}
                                />
                                <Line type="monotone" dataKey="humidity" stroke="#4ecdc4" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CCardBody>
                        </CCard>

                        {/* Battery Chart */}
                        <CCard style={{ border: '1px solid #e9ecef' }}>
                          <CCardHeader style={{ 
                            padding: isMobile ? '8px 12px' : '12px 16px', 
                            background: '#f8f9fa', 
                            fontSize: isMobile ? '12px' : '14px', 
                            fontWeight: '600' 
                          }}>
                            <BsBatteryHalf style={{ marginRight: '8px', color: '#45b7d1' }} />
                            Battery Level
                          </CCardHeader>
                          <CCardBody style={{ padding: isMobile ? '8px' : '12px' }}>
                            <ResponsiveContainer width="100%" height={isMobile ? 120 : 180}>
                              <LineChart data={batteryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" tick={false} />
                                <YAxis fontSize={isMobile ? 8 : 10} />
                                <Tooltip
                                  formatter={(value) => [`${value}%`, 'Battery']}
                                  labelFormatter={(label) => `Time: ${label}`}
                                />
                                <Line type="monotone" dataKey="battery" stroke="#45b7d1" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </CCardBody>
                        </CCard>

                        {/* Speed Chart */}
                        <CCard style={{ border: '1px solid #e9ecef' }}>
                          <CCardHeader style={{ 
                            padding: isMobile ? '8px 12px' : '12px 16px', 
                            background: '#f8f9fa', 
                            fontSize: isMobile ? '12px' : '14px', 
                            fontWeight: '600' 
                          }}>
                            <BsSpeedometer2 style={{ marginRight: '8px', color: '#96ceb4' }} />
                            Speed
                          </CCardHeader>
                          <CCardBody style={{ padding: isMobile ? '8px' : '12px' }}>
                            <ResponsiveContainer width="100%" height={isMobile ? 120 : 180}>
                              <LineChart data={speedData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" tick={false} />
                                <YAxis fontSize={isMobile ? 8 : 10} />
                                <Tooltip
                                  formatter={(value) => [`${value} km/h`, 'Speed']}
                                  labelFormatter={(label) => `Time: ${label}`}
                                />
                                <Line type="monotone" dataKey="speed" stroke="#96ceb4" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                            </CCardBody>
                        </CCard>
                      </div>
                    )}
                    
                    {shipmentTab === 'Alerts' && (
                      <div style={{ textAlign: 'center', padding: isMobile ? '20px' : '40px 20px', color: '#666' }}>
                        <BsExclamationTriangle size={isMobile ? 24 : 32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <div style={{ fontSize: isMobile ? '12px' : '14px' }}>No alerts for this shipment</div>
                      </div>
                    )}
                    
                    {shipmentTab === 'Reports' && (
                      <div style={{ textAlign: 'center', padding: isMobile ? '20px' : '40px 20px', color: '#666' }}>
                        <BsFileText size={isMobile ? 24 : 32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <div style={{ fontSize: isMobile ? '12px' : '14px' }}>Reports feature coming soon</div>
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
        top: '140px', // Position below navbar with some margin
        left: sidebarCollapsed 
          ? '20px' 
          : (isMobile 
              ? (selectedShipment ? 'calc(100vw - 60px)' : 'calc(100vw - 60px)')
              : (selectedShipment ? '470px' : '420px')
            ),
        zIndex: 1001,
        transition: 'left 0.3s ease'
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
      </div>

      {/* Full Page Map */}
      <div style={{ 
        flex: 1, 
        position: 'relative',
        height: 'calc(100vh - 120px)', // Adjust for navbar
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        minWidth: 0
      }}>
        <MapContainer
          center={[42.798939, -74.658409]}
          zoom={isMobile ? 4 : 5}
          style={{ 
            height: 'calc(100vh - 120px)', // Adjust for navbar
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            margin: 0,
            padding: 0
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Always show start and destination markers if available */}
          {startCoord && (
            <Marker position={startCoord} icon={numberIcon('1')}>
              <Popup>
                Start: {selectedShipment?.legs?.[0]?.shipFromAddress || legs[0]?.shipFromAddress}
              </Popup>
            </Marker>
          )}
          {destinationCoord && (
            <Marker position={destinationCoord} icon={numberIcon('2')}>
              <Popup>
                End: {selectedShipment?.legs?.[selectedShipment.legs.length - 1]?.stopAddress || legs[legs.length - 1]?.stopAddress}
              </Popup>
            </Marker>
          )}
          
          {/* Show shipment route if selected */}
          {liveRoute.length > 0 && (
            <>
              <FitBounds route={liveRoute} />
              <Polyline positions={liveRoute} color="blue" />
              {/* Dashed line from last GPS point to destination, if not at destination */}
              {destinationCoord && liveRoute.length > 0 && (
                (() => {
                  const last = liveRoute[liveRoute.length - 1];
                  if (last[0] !== destinationCoord[0] || last[1] !== destinationCoord[1]) {
                    return (
                      <Polyline
                        positions={[last, destinationCoord]}
                        color="blue"
                        dashArray="8"
                      />
                    );
                  }
                  return null;
                })()
              )}
              <Marker position={liveRoute[liveRoute.length - 1]} icon={customIcon}>
                <Popup>Current Location</Popup>
              </Marker>
            </>
          )}
          
          {/* Show preview line for new shipment or for selected shipment with no routeData */}
          {liveRoute.length === 0 && startCoord && destinationCoord && (
            <Polyline positions={[startCoord, destinationCoord]} color="blue" dashArray="8" />
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

        {/* Selected Shipment Info - Show when shipment selected and sidebar collapsed */}
        {sidebarCollapsed && selectedShipment && (
          <div style={{
            position: 'absolute',
            top: '20px', // Reduced from 80px since we're already below navbar
            left: '20px',
            right: '20px',
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxWidth: '350px'
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