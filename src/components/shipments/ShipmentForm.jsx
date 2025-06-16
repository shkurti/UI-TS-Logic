import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const ShipmentForm = ({ onSubmit, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initialValues = {
    origin: {
      name: '',
      latitude: '',
      longitude: '',
    },
    destination: {
      name: '',
      latitude: '',
      longitude: '',
    },
    departureTime: '',
    estimatedArrival: '',
    vehicleType: '',
    notes: '',
  };

  const validationSchema = Yup.object({
    origin: Yup.object({
      name: Yup.string().required('Origin name is required'),
      latitude: Yup.number().required('Origin latitude is required'),
      longitude: Yup.number().required('Origin longitude is required'),
    }),
    destination: Yup.object({
      name: Yup.string().required('Destination name is required'),
      latitude: Yup.number().required('Destination latitude is required'),
      longitude: Yup.number().required('Destination longitude is required'),
    }),
    departureTime: Yup.date().required('Departure time is required'),
    estimatedArrival: Yup.date().required('Estimated arrival is required'),
    vehicleType: Yup.string().required('Vehicle type is required'),
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        await onSubmit(values);
        onClose();
      } catch (err) {
        setError('Failed to create shipment. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="shipment-form-container">
      <h3>Create New Shipment</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={formik.handleSubmit}>
        <div className="form-group">
          <h4>Origin</h4>
          <div className="form-row">
            <label htmlFor="origin.name">Name</label>
            <input
              id="origin.name"
              name="origin.name"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.origin.name}
            />
            {formik.touched.origin?.name && formik.errors.origin?.name && (
              <div className="error">{formik.errors.origin.name}</div>
            )}
          </div>
          <div className="form-row coordinates">
            <div className="coord-input">
              <label htmlFor="origin.latitude">Latitude</label>
              <input
                id="origin.latitude"
                name="origin.latitude"
                type="number"
                step="0.000001"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.origin.latitude}
              />
              {formik.touched.origin?.latitude && formik.errors.origin?.latitude && (
                <div className="error">{formik.errors.origin.latitude}</div>
              )}
            </div>
            <div className="coord-input">
              <label htmlFor="origin.longitude">Longitude</label>
              <input
                id="origin.longitude"
                name="origin.longitude"
                type="number"
                step="0.000001"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.origin.longitude}
              />
              {formik.touched.origin?.longitude && formik.errors.origin?.longitude && (
                <div className="error">{formik.errors.origin.longitude}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <h4>Destination</h4>
          <div className="form-row">
            <label htmlFor="destination.name">Name</label>
            <input
              id="destination.name"
              name="destination.name"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.destination.name}
            />
            {formik.touched.destination?.name && formik.errors.destination?.name && (
              <div className="error">{formik.errors.destination.name}</div>
            )}
          </div>
          <div className="form-row coordinates">
            <div className="coord-input">
              <label htmlFor="destination.latitude">Latitude</label>
              <input
                id="destination.latitude"
                name="destination.latitude"
                type="number"
                step="0.000001"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.destination.latitude}
              />
              {formik.touched.destination?.latitude && formik.errors.destination?.latitude && (
                <div className="error">{formik.errors.destination.latitude}</div>
              )}
            </div>
            <div className="coord-input">
              <label htmlFor="destination.longitude">Longitude</label>
              <input
                id="destination.longitude"
                name="destination.longitude"
                type="number"
                step="0.000001"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.destination.longitude}
              />
              {formik.touched.destination?.longitude && formik.errors.destination?.longitude && (
                <div className="error">{formik.errors.destination.longitude}</div>
              )}
            </div>
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="departureTime">Departure Time</label>
          <input
            id="departureTime"
            name="departureTime"
            type="datetime-local"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.departureTime}
          />
          {formik.touched.departureTime && formik.errors.departureTime && (
            <div className="error">{formik.errors.departureTime}</div>
          )}
        </div>

        <div className="form-row">
          <label htmlFor="estimatedArrival">Estimated Arrival</label>
          <input
            id="estimatedArrival"
            name="estimatedArrival"
            type="datetime-local"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.estimatedArrival}
          />
          {formik.touched.estimatedArrival && formik.errors.estimatedArrival && (
            <div className="error">{formik.errors.estimatedArrival}</div>
          )}
        </div>

        <div className="form-row">
          <label htmlFor="vehicleType">Vehicle Type</label>
          <select
            id="vehicleType"
            name="vehicleType"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.vehicleType}
          >
            <option value="">Select a vehicle type</option>
            <option value="truck">Truck</option>
            <option value="van">Van</option>
            <option value="car">Car</option>
            <option value="ship">Ship</option>
            <option value="airplane">Airplane</option>
          </select>
          {formik.touched.vehicleType && formik.errors.vehicleType && (
            <div className="error">{formik.errors.vehicleType}</div>
          )}
        </div>

        <div className="form-row">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.notes}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Shipment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShipmentForm;
