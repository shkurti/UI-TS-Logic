import React from 'react'
import {
  CButton,
  CNav,
  CNavItem,
  CNavLink,
} from '@coreui/react'
import { 
  BsThermometerHalf, 
  BsExclamationTriangle, 
  BsFileText, 
  BsArrowLeft, 
  BsMap 
} from 'react-icons/bs'
import { DesktopSensorCharts, MobileSensorChart } from './SensorCharts'

export const ShipmentDetailsHeader = ({ 
  selectedShipment, 
  setSelectedShipment 
}) => (
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
)

export const ShipmentDetailsTabs = ({ 
  shipmentTab, 
  setShipmentTab 
}) => (
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
)

export const ShipmentDetailsContent = ({
  shipmentTab,
  temperatureData,
  humidityData,
  batteryData,
  speedData,
  handleChartHover,
  handleChartMouseLeave
}) => (
  <div style={{ 
    flex: 1, 
    overflow: 'auto', 
    padding: '8px 0',
    WebkitOverflowScrolling: 'touch'
  }}>
    {shipmentTab === 'Sensors' && (
      <DesktopSensorCharts
        temperatureData={temperatureData}
        humidityData={humidityData}
        batteryData={batteryData}
        speedData={speedData}
        handleChartHover={handleChartHover}
        handleChartMouseLeave={handleChartMouseLeave}
      />
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
)

export const MobileShipmentDetails = ({
  selectedShipment,
  setSelectedShipment,
  isShipmentInfoExpanded,
  setIsShipmentInfoExpanded,
  isMapExpanded,
  setIsMapExpanded,
  shipmentTab,
  setShipmentTab,
  mobileSensorTab,
  setMobileSensorTab,
  temperatureData,
  humidityData,
  batteryData,
  speedData,
  handleChartHover,
  handleChartMouseLeave
}) => {
  const getSensorData = () => {
    switch (mobileSensorTab) {
      case 'Temperature': return temperatureData
      case 'Humidity': return humidityData
      case 'Battery': return batteryData
      case 'Speed': return speedData
      default: return []
    }
  }

  return (
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
          <div style={{ fontSize: '12px', color: '#666' }}>
            {isMapExpanded ? 'Collapse ⬇️' : 'Expand ⬆️'}
          </div>
        </div>
        
        <div style={{ height: isMapExpanded ? 'calc(100% - 48px)' : '202px' }}>
          {/* Map container will be inserted here by the parent component */}
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
          <MobileSensorChart
            sensorType={mobileSensorTab}
            data={getSensorData()}
            handleChartHover={handleChartHover}
            handleChartMouseLeave={handleChartMouseLeave}
          />
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
    </div>
  )
}
