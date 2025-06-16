import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BsThermometerHalf, BsDroplet, BsBatteryHalf, BsSpeedometer2 } from 'react-icons/bs'

const SensorChart = ({ 
  title, 
  icon: Icon, 
  color, 
  data, 
  dataKey, 
  unit, 
  onMouseMove, 
  onMouseLeave 
}) => (
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
      <Icon style={{ marginRight: '8px', color }} />
      {title}
    </div>
    <div style={{ padding: '0' }}>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart 
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tick={false} />
          <YAxis fontSize={10} width={40} />
          <Tooltip
            formatter={(value) => [`${value}${unit}`, title]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)

export const DesktopSensorCharts = ({ 
  temperatureData, 
  humidityData, 
  batteryData, 
  speedData, 
  handleChartHover, 
  handleChartMouseLeave 
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <SensorChart
      title="Temperature"
      icon={BsThermometerHalf}
      color="#ff6b6b"
      data={temperatureData}
      dataKey="temperature"
      unit="°C"
      onMouseMove={(data) => handleChartHover(data, 'Temperature')}
      onMouseLeave={handleChartMouseLeave}
    />
    <SensorChart
      title="Humidity"
      icon={BsDroplet}
      color="#4ecdc4"
      data={humidityData}
      dataKey="humidity"
      unit="%"
      onMouseMove={(data) => handleChartHover(data, 'Humidity')}
      onMouseLeave={handleChartMouseLeave}
    />
    <SensorChart
      title="Battery Level"
      icon={BsBatteryHalf}
      color="#45b7d1"
      data={batteryData}
      dataKey="battery"
      unit="%"
      onMouseMove={(data) => handleChartHover(data, 'Battery')}
      onMouseLeave={handleChartMouseLeave}
    />
    <SensorChart
      title="Speed"
      icon={BsSpeedometer2}
      color="#96ceb4"
      data={speedData}
      dataKey="speed"
      unit=" km/h"
      onMouseMove={(data) => handleChartHover(data, 'Speed')}
      onMouseLeave={handleChartMouseLeave}
    />
  </div>
)

export const MobileSensorChart = ({ 
  sensorType, 
  data, 
  handleChartHover, 
  handleChartMouseLeave 
}) => {
  const sensorConfig = {
    Temperature: { icon: BsThermometerHalf, color: '#ff6b6b', unit: '°C', dataKey: 'temperature' },
    Humidity: { icon: BsDroplet, color: '#4ecdc4', unit: '%', dataKey: 'humidity' },
    Battery: { icon: BsBatteryHalf, color: '#45b7d1', unit: '%', dataKey: 'battery' },
    Speed: { icon: BsSpeedometer2, color: '#96ceb4', unit: ' km/h', dataKey: 'speed' }
  }

  const config = sensorConfig[sensorType]
  const Icon = config.icon

  return (
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
        <Icon style={{ color: config.color }} />
        {sensorType}
      </h6>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart 
          data={data}
          margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
          onMouseMove={(data) => handleChartHover(data, sensorType)}
          onMouseLeave={handleChartMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tick={false} />
          <YAxis fontSize={10} width={35} />
          <Tooltip
            formatter={(value) => [`${value}${config.unit}`, sensorType]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey={config.dataKey}
            stroke={config.color}
            strokeWidth={2} 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
