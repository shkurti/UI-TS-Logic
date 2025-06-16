import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TelemetryChart = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Track historical data for charting
  const [historicalData, setHistoricalData] = useState({});
  
  // Update historical data when new telemetry arrives
  useEffect(() => {
    if (!data) return;

    const timestamp = new Date().toISOString();
    
    setHistoricalData(prevData => {
      const newData = { ...prevData };
      
      Object.entries(data).forEach(([key, value]) => {
        if (!newData[key]) {
          newData[key] = [];
        }
        
        // Keep only the last 50 data points
        if (newData[key].length >= 50) {
          newData[key].shift();
        }
        
        newData[key].push({
          timestamp,
          value: parseFloat(value) || 0
        });
      });
      
      return newData;
    });
    
    // Set initial selected metric if none is selected yet
    if (!selectedMetric && Object.keys(data).length > 0) {
      setSelectedMetric(Object.keys(data)[0]);
    }
  }, [data]);
  
  // Initialize and update chart
  useEffect(() => {
    if (!selectedMetric || !historicalData[selectedMetric]) return;
    
    const ctx = chartRef.current.getContext('2d');
    
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const metricData = historicalData[selectedMetric];
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: metricData.map((_, index) => index),
        datasets: [
          {
            label: selectedMetric,
            data: metricData.map(item => item.value),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500
        },
        scales: {
          y: {
            beginAtZero: false
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(tooltipItems) {
                const index = tooltipItems[0].dataIndex;
                return metricData[index].timestamp;
              }
            }
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [selectedMetric, historicalData]);
  
  if (!data || Object.keys(data).length === 0) {
    return <div className="no-telemetry">No telemetry data available</div>;
  }
  
  return (
    <div className="telemetry-chart-container">
      <div className="metric-selector">
        <label htmlFor="metric-select">Select metric to display:</label>
        <select
          id="metric-select"
          value={selectedMetric || ''}
          onChange={(e) => setSelectedMetric(e.target.value)}
        >
          {Object.keys(data).map(key => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>
      
      <div className="chart-wrapper">
        <canvas ref={chartRef} height="200"></canvas>
      </div>
    </div>
  );
};

export default TelemetryChart;
