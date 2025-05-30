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
} from '@coreui/react'
import { BsThermometerHalf, BsDroplet, BsBatteryHalf, BsSpeedometer2, BsSearch, BsFilter, BsPlus, BsTrash, BsMap, BsInfoCircle, BsGeoAlt } from 'react-icons/bs'
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

  const deleteShipment = async () => {
    if (!selectedShipment) {
      alert('Please select a shipment to delete.')
      return
    }
    if (!window.confirm('Are you sure you want to delete this shipment?')) {
      return
    }
    try {
      const response = await fetch(
        `https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_meta/${selectedShipment._id}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        setShipments((prev) => prev.filter((s) => s._id !== selectedShipment._id))
        setSelectedShipment(null)
        setRouteData([])
        alert('Shipment deleted successfully.')
      } else {
        alert('Failed to delete shipment.')
      }
    } catch (e) {
      alert('Error deleting shipment.')
    }
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
    });

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Transit': return 'primary'
      case 'Upcoming': return 'warning'
      case 'Completed': return 'success'
      default: return 'secondary'
    }
  }

  return (
    <div className="shipments-page" style={{ background: '#f8f9fa', minHeight: '100vh', padding: '20px 0' }}>
      {/* Alert Messages */}
      {alertMessage && (
        <CAlert color="success" dismissible onClose={() => setAlertMessage('')} className="mb-4">
          {alertMessage}
        </CAlert>
      )}

      {/* Enhanced Header */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '32px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BsMap size={40} />
              Shipment Management
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: 0 }}>
              Track and manage your shipments in real-time with GPS monitoring and sensor data
            </p>
          </div>
        </CCol>
      </CRow>

      {/* Enhanced Map Section */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard style={{ 
            borderRadius: '16px', 
            boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
            border: 'none',
            overflow: 'hidden'
          }}>
            <CCardHeader style={{ 
              background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              padding: '20px 24px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BsGeoAlt size={20} />
                <h5 style={{ margin: 0, fontWeight: '600' }}>Live Tracking Map</h5>
              </div>
            </CCardHeader>
            <CCardBody style={{ padding: 0 }}>
              <MapContainer
                center={[42.798939, -74.658409]}
                zoom={5}
                style={{ height: '450px', width: '100%' }}
              >
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
                    <Polyline
                      positions={liveRoute}
                      color="blue"
                    />
                    {/* Dashed line from last GPS point to destination, if not at destination */}
                    {destinationCoord && liveRoute.length > 0 && (
                      (() => {
                        const last = liveRoute[liveRoute.length - 1];
                        if (
                          last[0] !== destinationCoord[0] ||
                          last[1] !== destinationCoord[1]
                        ) {
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
                    {/* Last GPS point marker (optional, can use default icon) */}
                    <Marker
                      position={liveRoute[liveRoute.length - 1]}
                      icon={customIcon}
                    >
                      <Popup>Last Point</Popup>
                    </Marker>
                  </>
                )}
                {/* Show preview line for new shipment or for selected shipment with no routeData */}
                {liveRoute.length === 0 && startCoord && destinationCoord && (
                  <>
                    <Polyline
                      positions={[startCoord, destinationCoord]}
                      color="blue"
                      dashArray="8"
                    />
                  </>
                )}
              </MapContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Enhanced Shipment List Section */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard style={{ 
            borderRadius: '16px', 
            boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
            border: 'none'
          }}>
            <CCardHeader style={{ 
              background: '#fff', 
              borderBottom: '1px solid #e9ecef',
              borderRadius: '16px 16px 0 0',
              padding: '24px'
            }}>
              {/* Action Buttons Row */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'center', 
                gap: '16px', 
                marginBottom: '24px'
              }}>
                <CButton 
                  color="primary" 
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)'
                  }}
                >
                  <BsPlus size={20} />
                  Create New Shipment
                </CButton>
                <CButton
                  color="danger"
                  variant="outline"
                  disabled={!selectedShipment}
                  onClick={deleteShipment}
                  style={{
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <BsTrash size={16} />
                  Delete Selected
                </CButton>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CBadge color="info" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>
                    {filteredShipments.length} Shipments
                  </CBadge>
                  {isLoading && <CSpinner size="sm" />}
                </div>
              </div>

              {/* Enhanced Search and Filter Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <CInputGroup style={{ maxWidth: '350px' }}>
                  <CInputGroupText style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                    <BsSearch />
                  </CInputGroupText>
                  <CFormInput
                    placeholder="Search shipments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderLeft: 'none' }}
                  />
                </CInputGroup>
                <CInputGroup style={{ maxWidth: '250px' }}>
                  <CInputGroupText style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                    <BsFilter />
                  </CInputGroupText>
                  <CFormInput
                    placeholder="Filter by Ship From"
                    value={shipFromFilter}
                    onChange={(e) => setShipFromFilter(e.target.value)}
                    style={{ borderLeft: 'none' }}
                  />
                </CInputGroup>
                <CInputGroup style={{ maxWidth: '250px' }}>
                  <CInputGroupText style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                    <BsFilter />
                  </CInputGroupText>
                  <CFormInput
                    placeholder="Filter by Ship To"
                    value={shipToFilter}
                    onChange={(e) => setShipToFilter(e.target.value)}
                    style={{ borderLeft: 'none' }}
                  />
                </CInputGroup>
              </div>

              {/* Enhanced Status Tabs */}
              <CNav variant="pills" role="tablist" style={{ gap: '8px' }}>
                {['In Transit', 'Upcoming', 'Completed'].map((tab) => (
                  <CNavItem key={tab}>
                    <CNavLink
                      active={activeTab === tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        borderRadius: '12px',
                        padding: '12px 20px',
                        fontWeight: '600',
                        border: 'none',
                        background: activeTab === tab ? `var(--cui-${getStatusColor(tab)})` : '#f8f9fa',
                        color: activeTab === tab ? 'white' : '#6c757d',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {tab} ({tab === 'In Transit' ? filteredShipments.length : tab === 'Upcoming' ? 8 : 23})
                      <CBadge 
                        color={activeTab === tab ? 'light' : getStatusColor(tab)} 
                        style={{ marginLeft: '8px' }}
                      >
                        {tab === 'In Transit' ? filteredShipments.length : tab === 'Upcoming' ? 8 : 23}
                      </CBadge>
                    </CNavLink>
                  </CNavItem>
                ))}
              </CNav>
            </CCardHeader>

            <CCardBody style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <CTable hover responsive className="mb-0" style={{ minWidth: '900px' }}>
                  <CTableHead style={{ background: '#f8f9fa' }}>
                    <CTableRow>
                      <CTableHeaderCell style={{ fontWeight: '600', padding: '16px 24px', border: 'none' }}>
                        Shipment ID
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ fontWeight: '600', padding: '16px 24px', border: 'none' }}>
                        Ship From
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ fontWeight: '600', padding: '16px 24px', border: 'none' }}>
                        Ship To
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ fontWeight: '600', padding: '16px 24px', border: 'none' }}>
                        Status
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ fontWeight: '600', padding: '16px 24px', border: 'none' }}>
                        Arrival Date
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ fontWeight: '600', padding: '16px 24px', border: 'none' }}>
                        Actions
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredShipments.map((shipment, index) => (
                      <CTableRow
                        key={index}
                        style={{
                          cursor: 'pointer',
                          background: selectedShipment === shipment ? '#e3f2fd' : 'white',
                          transition: 'all 0.2s ease',
                          borderLeft: selectedShipment === shipment ? '4px solid #2196f3' : '4px solid transparent'
                        }}
                        onClick={() => handleShipmentClick(shipment)}
                      >
                        <CTableDataCell style={{ padding: '20px 24px', fontWeight: '600', color: '#2196f3' }}>
                          #{shipment.trackerId || 'N/A'}
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '500' }}>
                              {shipment.legs?.[0]?.shipFromAddress?.substring(0, 30) || 'N/A'}
                              {shipment.legs?.[0]?.shipFromAddress?.length > 30 ? '...' : ''}
                            </span>
                            <small style={{ color: '#6c757d' }}>Origin</small>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '500' }}>
                              {shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.substring(0, 30) || 'N/A'}
                              {shipment.legs?.[shipment.legs.length - 1]?.stopAddress?.length > 30 ? '...' : ''}
                            </span>
                            <small style={{ color: '#6c757d' }}>Destination</small>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '20px 24px' }}>
                          <CBadge color={getStatusColor('In Transit')} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                            In Transit
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '500' }}>
                              {new Date(shipment.legs?.[shipment.legs.length - 1]?.arrivalDate).toLocaleDateString() || 'N/A'}
                            </span>
                            <small style={{ color: '#6c757d' }}>
                              {new Date(shipment.legs?.[shipment.legs.length - 1]?.arrivalDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || ''}
                            </small>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell style={{ padding: '20px 24px' }}>
                          <CButton
                            size="sm"
                            color="info"
                            variant="outline"
                            style={{ borderRadius: '8px', padding: '6px 12px' }}
                          >
                            <BsInfoCircle size={14} style={{ marginRight: '4px' }} />
                            View Details
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                    {filteredShipments.length === 0 && (
                      <CTableRow>
                        <CTableDataCell colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                          <BsInfoCircle size={24} style={{ marginBottom: '12px' }} />
                          <div>No shipments found matching your criteria</div>
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Enhanced Details Panel */}
      {selectedShipment && (
        <CRow>
          <CCol xs={12}>
            <CCard style={{ 
              borderRadius: '16px', 
              boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
              border: 'none'
            }}>
              <CCardHeader style={{ 
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '16px 16px 0 0',
                padding: '24px',
                color: 'white'
              }}>
                <h5 style={{ margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BsInfoCircle size={20} />
                  Shipment Details - #{selectedShipment.trackerId}
                </h5>
                <CNav variant="pills" role="tablist" style={{ gap: '8px', marginTop: '16px' }}>
                  {['Details', 'Sensors', 'Alerts', 'Reports'].map((tab) => (
                    <CNavItem key={tab}>
                      <CNavLink
                        active={shipmentTab === tab}
                        onClick={() => setShipmentTab(tab)}
                        style={{
                          borderRadius: '10px',
                          padding: '10px 16px',
                          fontWeight: '500',
                          background: shipmentTab === tab ? 'rgba(255,255,255,0.2)' : 'transparent',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                      >
                        {tab}
                      </CNavLink>
                    </CNavItem>
                  ))}
                </CNav>
              </CCardHeader>
              <CCardBody style={{ background: '#f8f9fa', padding: '32px' }}>
                {shipmentTab === 'Details' && (
                  <div style={{ maxWidth: 500, margin: '0 auto' }}>
                    <p>
                      <strong>Shipment ID:</strong> {selectedShipment.trackerId}
                    </p>
                    <p>
                      <strong>Ship From:</strong> {selectedShipment.legs?.[0]?.shipFromAddress || 'N/A'}
                    </p>
                    <p>
                      <strong>Ship To:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.stopAddress || 'N/A'}
                    </p>
                    <p>
                      <strong>Arrival Date:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.arrivalDate || 'N/A'}
                    </p>
                    <p>
                      <strong>Departure Date:</strong> {selectedShipment.legs?.[selectedShipment.legs.length - 1]?.departureDate || 'N/A'}
                    </p>
                  </div>
                )}
                {shipmentTab === 'Sensors' && (
                  <>
                    <div className="sensor-icons d-flex justify-content-center mb-4" style={{ gap: 20 }}>
                      {[
                        { key: 'Temperature', icon: BsThermometerHalf, color: '#ff6b6b' },
                        { key: 'Humidity', icon: BsDroplet, color: '#4ecdc4' },
                        { key: 'Battery', icon: BsBatteryHalf, color: '#45b7d1' },
                        { key: 'Speed', icon: BsSpeedometer2, color: '#96ceb4' }
                      ].map(({ key, icon: Icon, color }) => (
                        <div
                          key={key}
                          onClick={() => setActiveSensor(key)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            background: activeSensor === key ? color : 'white',
                            color: activeSensor === key ? 'white' : '#6c757d',
                            transition: 'all 0.3s ease',
                            minWidth: 90,
                            boxShadow: activeSensor === key ? `0 8px 20px ${color}40` : '0 2px 8px rgba(0,0,0,0.1)',
                            transform: activeSensor === key ? 'translateY(-2px)' : 'none'
                          }}
                        >
                          <Icon size={24} style={{ marginBottom: '8px' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{key}</span>
                        </div>
                      ))}
                    </div>
                    {/* Enhanced chart styling */}
                    <div style={{ 
                      background: 'white', 
                      borderRadius: '16px', 
                      padding: '24px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                      {activeSensor === 'Temperature' && (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={temperatureData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tick={false} />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name) => [
                                `${name === 'temperature' ? 'Temperature' : ''}: ${value}°C`,
                                null,
                              ]}
                              labelFormatter={(label) => `Timestamp: ${label}`}
                            />
                            <Line type="monotone" dataKey="temperature" stroke="#8884d8" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      {activeSensor === 'Humidity' && (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={humidityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tick={false} />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name) => [
                                `${name === 'humidity' ? 'Humidity' : ''}: ${value}%`,
                                null,
                              ]}
                              labelFormatter={(label) => `Timestamp: ${label}`}
                            />
                            <Line type="monotone" dataKey="humidity" stroke="#82ca9d" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      {activeSensor === 'Battery' && (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={batteryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tick={false} />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name) => [
                                `${name === 'battery' ? 'Battery Level' : ''}: ${value}%`,
                                null,
                              ]}
                              labelFormatter={(label) => `Timestamp: ${label}`}
                            />
                            <Line type="monotone" dataKey="battery" stroke="#ffc658" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      {activeSensor === 'Speed' && (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={speedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tick={false} />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name) => [
                                `${name === 'speed' ? 'Speed' : ''}: ${value} km/h`,
                                null,
                              ]}
                              labelFormatter={(label) => `Timestamp: ${label}`}
                            />
                            <Line type="monotone" dataKey="speed" stroke="#ff7300" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </>
                )}
                {shipmentTab === 'Alerts' && <div style={{ minHeight: 100 }}>Alerts content</div>}
                {shipmentTab === 'Reports' && <div style={{ minHeight: 100 }}>Reports content</div>}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {/* Enhanced Modal */}
      <CModal 
        visible={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        size="lg"
        style={{ '--cui-modal-border-radius': '16px' }}
      >
        <CModalHeader style={{ 
          background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px 16px 0 0'
        }}>
          <h5 style={{ margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BsPlus size={20} />
            Create New Shipment
          </h5>
        </CModalHeader>
        <CModalBody style={{ maxHeight: '500px', overflowY: 'auto', padding: '32px' }}>
          <CForm>
            {legs.map((leg, index) => (
              <div key={index} className="mb-4" style={{ borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                <h5 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Leg {leg.legNumber}</h5>
                <CRow className="mb-2">
                  {index === 0 && (
                    <CCol>
                      <CFormInput
                        label="Ship From Address"
                        value={leg.shipFromAddress}
                        onChange={(e) => handleInputChange(index, 'shipFromAddress', e.target.value)}
                      />
                    </CCol>
                  )}
                  {index < legs.length - 1 && (
                    <CCol>
                      <CFormInput
                        label="Stop Address"
                        value={leg.stopAddress}
                        onChange={(e) => handleInputChange(index, 'stopAddress', e.target.value)}
                      />
                    </CCol>
                  )}
                  {index === legs.length - 1 && (
                    <CCol>
                      <CFormInput
                        label="Ship To Address"
                        value={leg.stopAddress}
                        onChange={(e) => handleInputChange(index, 'stopAddress', e.target.value)}
                      />
                    </CCol>
                  )}
                </CRow>
                <CRow className="mb-2">
                  <CCol>
                    <CFormInput
                      type="datetime-local"
                      label="Ship Date"
                      value={leg.shipDate}
                      onChange={(e) => handleInputChange(index, 'shipDate', e.target.value)}
                    />
                  </CCol>
                  <CCol>
                    <CFormSelect
                      label="Mode"
                      value={leg.mode}
                      onChange={(e) => handleInputChange(index, 'mode', e.target.value)}
                    >
                      <option value="">Select Mode</option>
                      <option value="Road">Road</option>
                      <option value="Air">Air</option>
                      <option value="Sea">Sea</option>
                    </CFormSelect>
                  </CCol>
                </CRow>
                <CRow className="mb-2">
                  <CCol>
                    <CFormInput
                      label="Carrier"
                      value={leg.carrier}
                      onChange={(e) => handleInputChange(index, 'carrier', e.target.value)}
                    />
                  </CCol>
                  <CCol>
                    <CFormInput
                      type="datetime-local"
                      label="Arrival Date"
                      value={leg.arrivalDate}
                      onChange={(e) => handleInputChange(index, 'arrivalDate', e.target.value)}
                    />
                  </CCol>
                  <CCol>
                    <CFormInput
                      type="datetime-local"
                      label="Departure Date"
                      value={leg.departureDate}
                      onChange={(e) => handleInputChange(index, 'departureDate', e.target.value)}
                    />
                  </CCol>
                </CRow>
                {leg.mode === 'Air' && (
                  <CFormInput
                    label="AWB"
                    value={leg.awb}
                    onChange={(e) => handleInputChange(index, 'awb', e.target.value)}
                  />
                )}
              </div>
            ))}
            <CRow className="mb-3">
              <CCol>
                <CFormSelect
                  label="Select Tracker"
                  value={selectedTracker}
                  onChange={(e) => setSelectedTracker(e.target.value)}
                >
                  <option value="">Select a Tracker</option>
                  {trackers.map((tracker) => (
                    <option key={tracker.tracker_id} value={tracker.tracker_id}>
                      {tracker.tracker_name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol xs="auto" className="d-flex align-items-end">
                <CButton color="secondary" onClick={addLeg}>
                  Add Stop
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter style={{ border: 'none', padding: '24px 32px' }}>
          <CButton 
            color="primary" 
            onClick={submitForm}
            style={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)'
            }}
          >
            Create Shipment
          </CButton>
          <CButton 
            color="secondary" 
            variant="outline"
            onClick={() => setIsModalOpen(false)}
            style={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600'
            }}
          >
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Shipments