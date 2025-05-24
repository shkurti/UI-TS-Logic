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
  // Add state for destination coordinate (for efficient access)
  const [destinationCoord, setDestinationCoord] = useState(null);
  // Add this state to store the live GPS route for the selected shipment
  const [liveRoute, setLiveRoute] = useState([]);

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
        return;
      }
      // Use full address for both start and end
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
          setDestinationCoord(toCoord);
          setPreviewMarkers([
            { position: fromCoord, label: '1', popup: `Start: ${from}` },
            { position: toCoord, label: '2', popup: `End: ${to}` }
          ]);
        } else {
          setNewShipmentPreview(null);
          setPreviewMarkers([]);
          setDestinationCoord(null);
        }
      } else {
        setNewShipmentPreview(null);
        setPreviewMarkers([]);
        setDestinationCoord(null);
      }
    };
    showPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, legs]);

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
    // Fetch initial route data if needed (optional, since you already fetch on click)
    // setLiveRoute([]); // Optionally clear on new selection

    // Open WebSocket for real-time updates
    const ws = new WebSocket('wss://backend-ts-68222fd8cfc0.herokuapp.com/ws');
    ws.onopen = () => {
      // Optionally log or authenticate
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (
          message.operationType === 'insert' &&
          String(message.tracker_id) === String(selectedShipment.trackerId)
        ) {
          const { geolocation, new_record } = message;
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

    // Cleanup on unmount or tracker change
    return () => ws.close();
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
                {/* Show shipment route if selected */}
                {liveRoute.length > 0 && (
                  <>
                    <FitBounds route={liveRoute} />
                    <Polyline
                      positions={liveRoute}
                      color="blue"
                    />
                    {/* Marker 1: Start of GPS route */}
                    <Marker
                      position={liveRoute[0]}
                      icon={numberIcon('1')}
                    >
                      <Popup>
                        Start: {selectedShipment?.legs?.[0]?.shipFromAddress}
                      </Popup>
                    </Marker>
                    {/* Always show destination marker and dashed line if destinationCoord is available */}
                    {destinationCoord && Array.isArray(destinationCoord) && destinationCoord.length === 2 && !isNaN(destinationCoord[0]) && !isNaN(destinationCoord[1]) && (
                      <>
                        {/* Marker 2: Destination */}
                        <Marker
                          position={destinationCoord}
                          icon={numberIcon('2')}
                        >
                          <Popup>
                            End: {selectedShipment?.legs?.[selectedShipment.legs.length - 1]?.stopAddress}
                          </Popup>
                        </Marker>
                        {/* Dashed line from last GPS point to destination */}
                        <Polyline
                          positions={[
                            liveRoute[liveRoute.length - 1],
                            destinationCoord
                          ]}
                          color="blue"
                          dashArray="8"
                        />
                      </>
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
                {liveRoute.length === 0 && newShipmentPreview && (
                  <>
                    <Polyline
                      positions={newShipmentPreview}
                      color="blue"
                      dashArray="8"
                    />
                    {/* Marker 1: Start of preview */}
                    <Marker
                      position={newShipmentPreview[0]}
                      icon={numberIcon('1')}
                    >
                      <Popup>
                        Start: {legs[0]?.shipFromAddress || selectedShipment?.legs?.[0]?.shipFromAddress}
                      </Popup>
                    </Marker>
                    {/* Marker 2: End of preview */}
                    <Marker
                      position={newShipmentPreview[1]}
                      icon={numberIcon('2')}
                    >
                      <Popup>
                        End: {legs[legs.length - 1]?.stopAddress || selectedShipment?.legs?.[selectedShipment.legs.length - 1]?.stopAddress}
                      </Popup>
                    </Marker>
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