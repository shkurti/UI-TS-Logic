import React, { useEffect } from 'react'
import { TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { createNumberIcon, createCurrentLocationIcon, createHoverMarkerIcon } from '../utils/mapIcons'

// Map utility components
export function FitBounds({ route }) {
  const map = useMap()
  useEffect(() => {
    if (route && route.length > 0) {
      map.fitBounds(route)
    }
  }, [route, map])
  return null
}

export function MapInvalidator({ sidebarCollapsed, selectedShipment }) {
  const map = useMap()
  
  useEffect(() => {
    // Add a small delay to ensure DOM transition is complete
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 350)
    
    return () => clearTimeout(timer)
  }, [sidebarCollapsed, selectedShipment, map])
  
  return null
}

export function FitWorld({ trigger }) {
  const map = useMap()
  useEffect(() => {
    map.fitWorld()
  }, [trigger, map])
  return null
}

// Route visualization components
export const RoutePolylines = ({ liveRoute, allLegCoords, completedRoute, remainingRoute }) => {
  return (
    <>
      {/* Actual GPS route */}
      {liveRoute.length > 0 && (
        <Polyline
          positions={liveRoute}
          color="#2196f3"
          weight={4}
          opacity={0.9}
        />
      )}
      
      {/* Remaining route segments */}
      {remainingRoute.length > 1 && (
        <Polyline
          positions={remainingRoute}
          color="#9e9e9e"
          weight={3}
          opacity={0.6}
          dashArray="15, 15"
        />
      )}
      
      {/* Individual leg lines when no GPS data */}
      {(!liveRoute || liveRoute.length === 0) && allLegCoords.length > 1 && 
        allLegCoords.slice(0, -1).map((legCoord, index) => (
          <Polyline
            key={`leg-line-${index}`}
            positions={[legCoord.position, allLegCoords[index + 1].position]}
            color="#9e9e9e"
            weight={3}
            opacity={0.6}
            dashArray="15, 15"
          />
        ))
      }
    </>
  )
}

// Leg markers component
export const LegMarkers = ({ allLegCoords }) => {
  if (!allLegCoords || !allLegCoords.length) return null
  
  return (
    <>
      {allLegCoords.map((legCoord, index) => (
        <Marker 
          key={`leg-${index}`} 
          position={legCoord.position} 
          icon={createNumberIcon(legCoord.markerNumber.toString())}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <strong>
                {index === 0 ? '🚀 Departure Point' : 
                 index === allLegCoords.length - 1 ? '🏁 Destination Point' : 
                 `🛑 Stop ${index}`}
              </strong><br/>
              {legCoord.address}
              <br/><small>
                {index === 0 ? 'Start of shipment journey' :
                 index === allLegCoords.length - 1 ? 'End of shipment journey' :
                 `Intermediate stop #${index}`}
              </small>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

// Current position marker
export const CurrentPositionMarker = ({ liveRoute }) => {
  if (!liveRoute || liveRoute.length === 0) return null
  
  const currentPosition = liveRoute[liveRoute.length - 1]
  
  return (
    <Marker position={currentPosition} icon={createCurrentLocationIcon()}>
      <Popup>
        <div style={{ minWidth: '200px' }}>
          <strong>📍 Current Location</strong><br/>
          <small>Lat: {currentPosition[0].toFixed(6)}</small><br/>
          <small>Lng: {currentPosition[1].toFixed(6)}</small><br/>
          <small>Last updated: {new Date().toLocaleTimeString()}</small>
        </div>
      </Popup>
    </Marker>
  )
}

// Sensor hover marker
export const HoverMarker = ({ hoverMarker }) => {
  if (!hoverMarker) return null
  
  return (
    <Marker 
      position={hoverMarker.position} 
      icon={createHoverMarkerIcon(hoverMarker.sensorType)}
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
  )
}

// Shipment preview markers
export const PreviewMarkers = ({ previewMarkers, isModalOpen }) => {
  if (!previewMarkers || !previewMarkers.length || !isModalOpen) return null
  
  return (
    <>
      {previewMarkers.map((marker, index) => (
        <Marker
          key={`preview-${index}`}
          position={marker.position}
          icon={createNumberIcon(marker.label)}
        >
          <Popup>{marker.popup}</Popup>
        </Marker>
      ))}
    </>
  )
}

// Shipment preview polyline
export const PreviewPolyline = ({ newShipmentPreview, isModalOpen }) => {
  if (!newShipmentPreview || !isModalOpen) return null
  
  return (
    <Polyline 
      positions={newShipmentPreview} 
      color="#2196f3" 
      weight={3}
      opacity={0.7}
      dashArray="10, 10"
    />
  )
}

export const MapContent = ({
  mapKey,
  fitWorld,
  sidebarCollapsed,
  selectedShipment,
  liveRoute,
  allLegCoords,
  completedRoute,
  remainingRoute,
  hoverMarker,
  newShipmentPreview,
  isModalOpen,
  previewMarkers,
  shipmentClusters,
  shipments
}) => {
  return (
    <>
      {fitWorld && <FitWorld trigger={mapKey} />}
      <MapInvalidator sidebarCollapsed={sidebarCollapsed} selectedShipment={selectedShipment} />
      
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Shipment clusters */}
      {!selectedShipment && shipmentClusters && shipmentClusters.length > 0 && (
        <ShipmentClusters 
          clusters={shipmentClusters}
          shipments={shipments}
        />
      )}
      
      {/* Route visualization */}
      {selectedShipment && (
        <RoutePolylines
          liveRoute={liveRoute}
          allLegCoords={allLegCoords}
          completedRoute={completedRoute}
          remainingRoute={remainingRoute}
        />
      )}
      
      {/* Leg markers */}
      {selectedShipment && allLegCoords.length > 0 && (
        <LegMarkers allLegCoords={allLegCoords} />
      )}
      
      {/* Current position */}
      {liveRoute && liveRoute.length > 0 && (
        <>
          <FitBounds route={[
            ...liveRoute, 
            ...allLegCoords.map(leg => leg.position)
          ]} />
          <CurrentPositionMarker liveRoute={liveRoute} />
        </>
      )}
      
      {/* Hover marker for sensor data */}
      <HoverMarker hoverMarker={hoverMarker} />
      
      {/* New shipment preview */}
      <PreviewPolyline newShipmentPreview={newShipmentPreview} isModalOpen={isModalOpen} />
      <PreviewMarkers previewMarkers={previewMarkers} isModalOpen={isModalOpen} />
    </>
  )
}

// Shipment clusters component
export const ShipmentClusters = ({ clusters, shipments }) => {
  return (
    <>
      {clusters.map((cluster) => (
        <Marker
          key={cluster.id}
          position={[cluster.lat, cluster.lng]}
          icon={createClusterIcon(cluster.count, cluster.region)}
        >
          <Popup>
            <div style={{ minWidth: '250px' }}>
              <strong style={{ fontSize: '16px', color: '#1976d2' }}>
                📊 {cluster.region}
              </strong>
              <div style={{ margin: '8px 0', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <strong>Total Shipments:</strong> <span style={{ color: '#d32f2f', fontSize: '18px' }}>{cluster.count}</span>
              </div>
              <strong>Origin Addresses:</strong>
              <div style={{ 
                maxHeight: '150px', 
                overflowY: 'auto', 
                fontSize: '13px', 
                marginTop: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px'
              }}>
                {cluster.addresses.map((addr, idx) => {
                  const shipmentCount = shipments.filter(
                    s => s.legs?.[0]?.shipFromAddress === addr
                  ).length
                  return (
                    <div key={idx} style={{ 
                      marginBottom: '6px', 
                      padding: '4px 0',
                      borderBottom: idx < cluster.addresses.length - 1 ? '1px solid #eee' : 'none'
                    }}>
                      <div style={{ fontWeight: '500' }}>
                        📍 {addr.length > 50 ? addr.substring(0, 47) + '...' : addr}
                      </div>
                      <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
                        {shipmentCount} shipment{shipmentCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

// Helper function to create cluster marker icon
const createClusterIcon = (count, region) => {
  const size = Math.min(60, Math.max(30, 20 + (count * 3)))
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
