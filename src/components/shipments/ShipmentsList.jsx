import React from 'react';
import { formatDate } from '../../utils/dateUtils';

const ShipmentsList = ({ shipments, onSelect, onDelete, selectedShipment }) => {
  if (!shipments || shipments.length === 0) {
    return (
      <div className="shipments-list-empty">
        <p>No shipments found. Create a new shipment to get started.</p>
      </div>
    );
  }

  return (
    <div className="shipments-list">
      <h3>Shipment Management</h3>
      <div className="list-container">
        {shipments.map(shipment => (
          <div 
            key={shipment.id} 
            className={`shipment-item ${selectedShipment?.id === shipment.id ? 'selected' : ''}`}
            onClick={() => onSelect(shipment)}
          >
            <div className="shipment-header">
              <span className="shipment-id">#{shipment.id}</span>
              <span className="shipment-status">{shipment.status}</span>
            </div>
            <div className="shipment-details">
              <div className="shipment-route">
                <div className="origin">{shipment.origin.name}</div>
                <div className="arrow">→</div>
                <div className="destination">{shipment.destination.name}</div>
              </div>
              <div className="shipment-dates">
                <div className="departure-date">
                  <span className="label">Departure:</span>
                  <span className="value">{formatDate(shipment.departureTime)}</span>
                </div>
                <div className="arrival-date">
                  <span className="label">Arrival:</span>
                  <span className="value">{formatDate(shipment.estimatedArrival)}</span>
                </div>
              </div>
              <div className="shipment-actions">
                <button 
                  className="delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(shipment.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShipmentsList;
