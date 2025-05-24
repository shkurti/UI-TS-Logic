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
} from '@coreui/react'
import { BsThermometerHalf, BsDroplet, BsBatteryHalf, BsSpeedometer2 } from 'react-icons/bs' // Changed BsSun to BsSpeedometer2
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
    const legs = shipment.legs || []
    const firstLeg = legs[0] || {}
    const lastLeg = legs[legs.length - 1] || {}
    const shipDate = firstLeg.shipDate
    const arrivalDate = lastLeg.arrivalDate

    // Always clear preview first
    setNewShipmentPreview(null)
    setPreviewMarkers([])

    // Always show planned preview if legs are valid (regardless of GPS data)
    let plannedPreviewPromise = Promise.resolve()
    if (
      legs.length > 0 &&
      firstLeg.shipFromAddress &&
      lastLeg.stopAddress &&
      firstLeg.shipFromAddress.trim() !== lastLeg.stopAddress.trim()
    ) {
      // Use the full address string for geocoding
      const from = { full: firstLeg.shipFromAddress };
      const to = { full: lastLeg.stopAddress };
      plannedPreviewPromise = Promise.all([geocodeAddress(from), geocodeAddress(to)]).then(([fromCoord, toCoord]) => {
        if (fromCoord && toCoord) {
          setNewShipmentPreview([fromCoord, toCoord])
          setPreviewMarkers([
            { position: fromCoord, label: '1', popup: `Start: ${from.full}` },
            { position: toCoord, label: '2', popup: `End: ${to.full}` }
          ])
        }
      })
    }

    if (!shipment.trackerId || !shipDate || !arrivalDate) {
      setRouteData([])
      return
    }

    try {
      const params = new URLSearchParams({
        tracker_id: shipment.trackerId,
        start: shipDate,
        end: arrivalDate,
      })
      const response = await fetch(`https://backend-ts-68222fd8cfc0.herokuapp.com/shipment_route_data?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRouteData(data)
        // Populate sensor data for tabs
        setTemperatureData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            temperature: record.temperature !== undefined ? parseFloat(record.temperature) : null,
          }))
        )
        setHumidityData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            humidity: record.humidity !== undefined ? parseFloat(record.humidity) : null,
          }))
        )
        setBatteryData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            battery: record.battery !== undefined ? parseFloat(record.battery) : null,
          }))
        )
        setSpeedData(
          data.map((record) => ({
            timestamp: record.timestamp || 'N/A',
            speed: record.speed !== undefined ? parseFloat(record.speed) : null,
          }))
        )
        // If GPS data exists, keep planned preview for broken line logic (do not clear here)
      } else {
        setRouteData([])
      }
    } catch (e) {
      setRouteData([])
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

  // Helper: Geocode an address to [lat, lng] using Nominatim
  // Accepts either a string or an object { full }
  const geocodeAddress = async (address) => {
    if (!address) return null;
    let query = '';
    if (typeof address === 'object' && address.full) {
      // Add ", USA" to bias results to the United States
      query = `${address.full}, USA`;
    } else {
      query = `${address}, USA`;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'shipment-ui/1.0' } });
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
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
        return;
      }
      const firstLeg = legs[0];
      const lastLeg = legs[legs.length - 1];
      const from = { full: firstLeg?.shipFromAddress };
      const to = { full: lastLeg?.stopAddress };
      if (from.full && to.full && from.full.trim() !== '' && to.full.trim() !== '' && from.full !== to.full) {
        const [fromCoord, toCoord] = await Promise.all([
          geocodeAddress(from),
          geocodeAddress(to),
        ]);
        if (fromCoord && toCoord) {
          setNewShipmentPreview([fromCoord, toCoord]);
        } else {
          setNewShipmentPreview(null);
        }
      } else {
        setNewShipmentPreview(null);
      }
    };
    showPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, legs]);

  // Also update preview markers for modal preview
  useEffect(() => {
    if (isModalOpen && newShipmentPreview && newShipmentPreview.length === 2) {
      const from = legs[0]?.shipFromAddress;
      const to = legs[legs.length - 1]?.stopAddress;
      setPreviewMarkers([
        { position: newShipmentPreview[0], label: '1', popup: `Start: ${from}` },
        { position: newShipmentPreview[1], label: '2', popup: `End: ${to}` }
      ]);
    } else if (!isModalOpen && (!selectedShipment || routeData.length > 0)) {
      setPreviewMarkers([]);
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

  // Helper: Calculate distance between two [lat, lon] points (Haversine)
  function haversineDistance([lat1, lon1], [lat2, lon2]) {
    function toRad(x) { return (x * Math.PI) / 180; }
    const R = 6371e3; // meters
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // --- MAP RENDER LOGIC ---
  // Compute planned and actual route segments for rendering
  let plannedStart = null, plannedEnd = null;
  if (newShipmentPreview && newShipmentPreview.length === 2) {
    plannedStart = newShipmentPreview[0];
    plannedEnd = newShipmentPreview[1];
  }

  // For actual route
  const actualRoute = routeData && routeData.length > 0
    ? routeData.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)])
    : [];

  // Compute remaining planned segment (from last actual point to destination)
  let remainingPlannedSegment = null;
  let hidePlanned = false;
  if (plannedStart && plannedEnd && actualRoute.length > 0) {
    const lastActual = actualRoute[actualRoute.length - 1];
    const distToDest = haversineDistance(lastActual, plannedEnd);
    // If last actual point is within 200m of destination, hide planned segment
    if (distToDest < 200) {
      hidePlanned = true;
    } else {
      remainingPlannedSegment = [lastActual, plannedEnd];
    }
  }

  // Add WebSocket state for real-time updates
  const [ws, setWs] = useState(null);

  // Real-time GPS updates for selected shipment
  useEffect(() => {
    if (!selectedShipment || !selectedShipment.trackerId) return;

    // Open WebSocket connection
    const wsInstance = new WebSocket('wss://backend-ts-68222fd8cfc0.herokuapp.com/ws');
    setWs(wsInstance);

    wsInstance.onopen = () => {
      // Optionally log or authenticate
      // console.log('WebSocket connection established for shipments');
    };

    wsInstance.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Only process messages for the selected shipment's tracker
        if (
          message.operationType === 'insert' &&
          (
            String(message.tracker_id) === String(selectedShipment.trackerId) ||
            String(message.trackerID) === String(selectedShipment.trackerId)
          )
        ) {
          // Support both new_record/geolocation and data array from Mongo
          if (Array.isArray(message.data)) {
            // If the message contains a data array (bulk GPS points)
            setRouteData((prev) => {
              // Convert each data point to the expected format
              const newPoints = message.data.map((d) => ({
                latitude: d.Lat,
                longitude: d.Lng,
                tracker_id: message.tracker_id ?? message.trackerID,
                trackerID: message.tracker_id ?? message.trackerID,
                timestamp: d.DT,
                temperature: d.Temp,
                humidity: d.Hum,
                battery: d.Batt,
                speed: d.Speed,
              }));
              // Only deduplicate, do not filter out all previous points (to preserve planned polyline)
              const updated = [...prev, ...newPoints];
              return deduplicateRoute(updated, undefined); // Do not filter by trackerId here
            });
          } else {
            // Single point update (new_record/geo)
            const { new_record, geolocation } = message;
            const lat = parseFloat(geolocation?.Lat);
            const lng = parseFloat(geolocation?.Lng);

            if (!isNaN(lat) && !isNaN(lng)) {
              setRouteData((prev) => {
                // Only deduplicate, do not filter out all previous points (to preserve planned polyline)
                const updated = [
                  ...prev,
                  {
                    ...new_record,
                    latitude: lat,
                    longitude: lng,
                    tracker_id: selectedShipment.trackerId,
                    trackerID: selectedShipment.trackerId,
                    timestamp: new_record?.timestamp || new Date().toISOString(),
                    temperature: new_record?.temperature ?? new_record?.Temp,
                    humidity: new_record?.humidity ?? new_record?.Hum,
                    battery: new_record?.battery ?? new_record?.Batt,
                    speed: new_record?.speed ?? new_record?.Speed,
                  },
                ];
                return deduplicateRoute(updated, undefined); // Do not filter by trackerId here
              });
            }
          }

          // Optionally update sensor data in real time
          if (new_record) {
            if (new_record.timestamp && new_record.temperature !== undefined) {
              setTemperatureData((prevData) => {
                if (!prevData.some((d) => d.timestamp === new_record.timestamp)) {
                  return [
                    ...prevData,
                    { timestamp: new_record.timestamp, temperature: parseFloat(new_record.temperature) },
                  ];
                }
                return prevData;
              });
            }
            if (new_record.timestamp && new_record.humidity !== undefined) {
              setHumidityData((prevData) => {
                if (!prevData.some((d) => d.timestamp === new_record.timestamp)) {
                  return [
                    ...prevData,
                    { timestamp: new_record.timestamp, humidity: parseFloat(new_record.humidity) },
                  ];
                }
                return prevData;
              });
            }
            if (new_record.timestamp && new_record.battery !== undefined) {
              setBatteryData((prevData) => {
                if (!prevData.some((d) => d.timestamp === new_record.timestamp)) {
                  return [
                    ...prevData,
                    { timestamp: new_record.timestamp, battery: parseFloat(new_record.battery) },
                  ];
                }
                return prevData;
              });
            }
            if (new_record.timestamp && new_record.speed !== undefined) {
              setSpeedData((prevData) => {
                if (!prevData.some((d) => d.timestamp === new_record.timestamp)) {
                  return [
                    ...prevData,
                    { timestamp: new_record.timestamp, speed: parseFloat(new_record.speed) },
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

    wsInstance.onerror = (error) => {
      // Optionally log error
      // console.error('WebSocket error:', error);
    };

    wsInstance.onclose = () => {
      // Optionally log close
      // console.log('WebSocket closed for shipments');
    };

    // Cleanup on unmount or tracker change
    return () => {
      wsInstance.close();
    };
    // Only re-run when selectedShipment.trackerId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShipment?.trackerId]);

  return (
    <>
      {/* MAP SECTION */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard>
            <CCardBody style={{ padding: 0 }}>
              <MapContainer
                center={[42.798939, -74.658409]}
                zoom={5}
                style={{ height: '400px', width: '100%', borderRadius: '8px' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* Show actual shipment route if available */}
                {actualRoute.length > 0 && (
                  <>
                    <FitBounds route={actualRoute} />
                    <Polyline
                      positions={actualRoute}
                      color="blue"
                    />
                    <Marker
                      position={actualRoute[actualRoute.length - 1]}
                      icon={customIcon}
                    >
                      <Popup>Last Point</Popup>
                    </Marker>
                  </>
                )}
                {/* Show planned route (dashed) if no actual route, or show remaining planned segment */}
                {plannedStart && plannedEnd && (
                  <>
                    {/* If no actual route, show full planned dashed line and markers */}
                    {actualRoute.length === 0 && (
                      <>
                        <Polyline
                          positions={[plannedStart, plannedEnd]}
                          color="blue"
                          dashArray="8"
                        />
                        {previewMarkers.map((marker, idx) => (
                          <Marker
                            key={idx}
                            position={marker.position}
                            icon={numberIcon(marker.label)}
                          >
                            <Popup>{marker.popup}</Popup>
                          </Marker>
                        ))}
                      </>
                    )}
                    {/* If actual route exists, show only remaining planned segment (dashed) and markers */}
                    {actualRoute.length > 0 && !hidePlanned && remainingPlannedSegment && (
                      <>
                        <Polyline
                          positions={remainingPlannedSegment}
                          color="blue"
                          dashArray="8"
                        />
                        {/* Start marker (number 1) at plannedStart */}
                        <Marker
                          position={plannedStart}
                          icon={numberIcon('1')}
                        >
                          <Popup>Start: {legs[0]?.shipFromAddress || previewMarkers[0]?.popup}</Popup>
                        </Marker>
                        {/* End marker (number 2) at plannedEnd */}
                        <Marker
                          position={plannedEnd}
                          icon={numberIcon('2')}
                        >
                          <Popup>End: {legs[legs.length - 1]?.stopAddress || previewMarkers[1]?.popup}</Popup>
                        </Marker>
                      </>
                    )}
                  </>
                )}
              </MapContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* SHIPMENT LIST & FILTERS */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard>
            <CCardHeader style={{ background: '#f8f9fa', borderBottom: '1px solid #e3e3e3' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <CButton color="primary" onClick={() => setIsModalOpen(true)}>
                    Create New Shipment
                  </CButton>
                  <CButton
                    color="danger"
                    disabled={!selectedShipment}
                    onClick={deleteShipment}
                  >
                    Delete Selected Shipment
                  </CButton>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <CFormInput placeholder="Search Shipments" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: 12 }}>
                <CFormInput placeholder="Filter by Ship From" style={{ maxWidth: 250 }} />
                <CFormInput placeholder="Filter by Ship To" style={{ maxWidth: 250 }} />
              </div>
              <CNav variant="tabs" role="tablist" className="mb-2">
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'In Transit'}
                    onClick={() => setActiveTab('In Transit')}
                  >
                    In Transit ({shipments.length})
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'Upcoming'}
                    onClick={() => setActiveTab('Upcoming')}
                  >
                    Upcoming (8)
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === 'Completed'}
                    onClick={() => setActiveTab('Completed')}
                  >
                    Completed (23)
                  </CNavLink>
                </CNavItem>
              </CNav>
            </CCardHeader>
            <CCardBody style={{ overflowX: 'auto', padding: 0 }}>
              <div style={{ minWidth: 900, padding: 16 }}>
                <CTable hover responsive bordered align="middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Shipment ID</CTableHeaderCell>
                      <CTableHeaderCell>Ship From</CTableHeaderCell>
                      <CTableHeaderCell>Ship To</CTableHeaderCell>
                      <CTableHeaderCell>Arrival Date</CTableHeaderCell>
                      <CTableHeaderCell>Departure Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {shipments.map((shipment, index) => (
                      <CTableRow
                        key={index}
                        style={{
                          cursor: 'pointer',
                          background: selectedShipment === shipment ? '#e9f5ff' : undefined,
                          transition: 'background 0.2s'
                        }}
                        onClick={() => handleShipmentClick(shipment)}
                      >
                        <CTableDataCell>{shipment.trackerId || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{shipment.legs?.[0]?.shipFromAddress || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{shipment.legs?.[shipment.legs.length - 1]?.stopAddress || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{shipment.legs?.[shipment.legs.length - 1]?.arrivalDate || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{shipment.legs?.[shipment.legs.length - 1]?.departureDate || 'N/A'}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* DETAILS/SENSORS/ALERTS/REPORTS TABS */}
      {selectedShipment && (
        <CRow>
          <CCol xs={12}>
            <CCard className="mb-4">
              <CCardHeader style={{ background: '#f8f9fa', borderBottom: '1px solid #e3e3e3' }}>
                <CNav variant="tabs" role="tablist">
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
                  <CNavItem>
                    <CNavLink
                      active={shipmentTab === 'Alerts'}
                      onClick={() => setShipmentTab('Alerts')}
                    >
                      Alerts
                    </CNavLink>
                  </CNavItem>
                  <CNavItem>
                    <CNavLink
                      active={shipmentTab === 'Reports'}
                      onClick={() => setShipmentTab('Reports')}
                    >
                      Reports
                    </CNavLink>
                  </CNavItem>
                </CNav>
              </CCardHeader>
              <CCardBody style={{ background: '#fcfcfc' }}>
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
                    <div className="sensor-icons d-flex justify-content-center mb-4" style={{ gap: 16 }}>
                      <div
                        className={`sensor-icon-wrapper${activeSensor === 'Temperature' ? ' bg-primary text-white' : ''}`}
                        onClick={() => setActiveSensor('Temperature')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: activeSensor === 'Temperature' ? '#0d6efd' : 'transparent',
                          color: activeSensor === 'Temperature' ? '#fff' : undefined,
                          transition: 'background 0.2s, color 0.2s',
                          minWidth: 70
                        }}
                      >
                        <BsThermometerHalf size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Temperature</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper${activeSensor === 'Humidity' ? ' bg-primary text-white' : ''}`}
                        onClick={() => setActiveSensor('Humidity')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: activeSensor === 'Humidity' ? '#0d6efd' : 'transparent',
                          color: activeSensor === 'Humidity' ? '#fff' : undefined,
                          transition: 'background 0.2s, color 0.2s',
                          minWidth: 70
                        }}
                      >
                        <BsDroplet size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Humidity</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper${activeSensor === 'Battery' ? ' bg-primary text-white' : ''}`}
                        onClick={() => setActiveSensor('Battery')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: activeSensor === 'Battery' ? '#0d6efd' : 'transparent',
                          color: activeSensor === 'Battery' ? '#fff' : undefined,
                          transition: 'background 0.2s, color 0.2s',
                          minWidth: 70
                        }}
                      >
                        <BsBatteryHalf size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Battery</span>
                      </div>
                      <div
                        className={`sensor-icon-wrapper${activeSensor === 'Speed' ? ' bg-primary text-white' : ''}`}
                        onClick={() => setActiveSensor('Speed')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 12px',
                          background: activeSensor === 'Speed' ? '#0d6efd' : 'transparent',
                          color: activeSensor === 'Speed' ? '#fff' : undefined,
                          transition: 'background 0.2s, color 0.2s',
                          minWidth: 70
                        }}
                      >
                        <BsSpeedometer2 size={16} className="sensor-icon" />
                        <span className="sensor-label" style={{ fontSize: 12 }}>Speed</span>
                      </div>
                    </div>
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
                  </>
                )}
                {shipmentTab === 'Alerts' && <div style={{ minHeight: 100 }}>Alerts content</div>}
                {shipmentTab === 'Reports' && <div style={{ minHeight: 100 }}>Reports content</div>}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {/* MODAL */}
      <CModal visible={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CModalHeader>Create New Shipment</CModalHeader>
        <CModalBody style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
        <CModalFooter>
          <CButton color="primary" onClick={submitForm}>
            Submit
          </CButton>
          <CButton color="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Shipments

// Helper to deduplicate route points (lat/lon) in order, but only for the current shipment
function deduplicateRoute(route, trackerId) {
  const seen = new Set();
  // Only filter by tracker if trackerId is provided, otherwise keep all
  return route.filter((point) => {
    if (trackerId !== undefined && trackerId !== null) {
      const pid = String(point.tracker_id ?? point.trackerID);
      if (pid !== String(trackerId)) return false;
    }
    const key = `${parseFloat(point.latitude)},${parseFloat(point.longitude)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}