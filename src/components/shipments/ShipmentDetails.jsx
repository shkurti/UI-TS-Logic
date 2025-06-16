import React from 'react';
import { formatDate, calculateTimeRemaining } from '../../utils/dateUtils';
import TelemetryChart from './TelemetryChart';

const ShipmentDetails = ({ shipment, trackingData }) => {
  if (!shipment) return null;

  const { timeRemaining, percentComplete } = calculateTimeRemaining(
    shipment.departureTime,
    shipment.estimatedArrival
  );

  const hasActiveTracking = trackingData?.currentPosition !== null;

  return (
    <div className="shipment-details-panel">
      <h3>Shipment #{shipment.id} Details</h3>
      
      <div className="detail-section">
        <h4>Route Information</h4>
        <div className="detail-row">
          <span className="detail-label">Origin:</span>
          <span className="detail-value">{shipment.origin.name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Destination:</span>
          <span className="detail-value">{shipment.destination.name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Distance:</span>
          <span className="detail-value">{shipment.distance || 'Calculating...'} km</span>
        </div>
      </div>
      
      <div className="detail-section">
        <h4>Schedule</h4>
        <div className="detail-row">
          <span className="detail-label">Departure:</span>
          <span className="detail-value">{formatDate(shipment.departureTime)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Estimated Arrival:</span>
          <span className="detail-value">{formatDate(shipment.estimatedArrival)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className={`detail-value status-${shipment.status.toLowerCase()}`}>
            {shipment.status}
          </span>
        </div>
      </div>
      
      <div className="progress-section">
        <h4>Journey Progress</h4>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${percentComplete}%` }}
          ></div>
        </div>
        <div className="progress-text">{percentComplete}% Complete</div>
        <div className="time-remaining">
          {timeRemaining > 0 
            ? `${timeRemaining} hours remaining` 
            : 'Arrived or delayed'}
        </div>
      </div>
      
      {hasActiveTracking && (
        <div className="telemetry-section">
          <h4>Live Telemetry</h4>
          
          {trackingData.telemetry && Object.keys(trackingData.telemetry).length > 0 && (
            <div className="telemetry-data">
              {Object.entries(trackingData.telemetry).map(([key, value]) => (
                <div key={key} className="telemetry-item">
                  <span className="telemetry-label">{key}:</span>
                  <span className="telemetry-value">{value}</span>
                </div>
              ))}
            </div>
          )}
          
          <TelemetryChart data={trackingData.telemetry} />
        </div>
      )}
      
      <div className="detail-section">
        <h4>Vehicle Information</h4>
        <div className="detail-row">
          <span className="detail-label">Type:</span>
          <span className="detail-value">{shipment.vehicleType}</span>
        </div>
      </div>
      
      {shipment.notes && (
        <div className="detail-section">
          <h4>Notes</h4>
          <p className="shipment-notes">{shipment.notes}</p>
        </div>
      )}
    </div>
  );
};

export default ShipmentDetails;
