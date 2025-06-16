import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const ShipmentClusters = ({ shipments }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!shipments || shipments.length === 0) return;
    
    // Create a marker cluster group
    const markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="cluster-marker">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40)
        });
      }
    });
    
    // Add all shipment origin markers to the cluster group
    shipments.forEach(shipment => {
      const marker = L.marker([shipment.origin.latitude, shipment.origin.longitude], {
        icon: L.divIcon({
          className: 'shipment-marker',
          html: '<div></div>',
          iconSize: [20, 20]
        })
      });
      
      marker.bindPopup(`
        <strong>Shipment #${shipment.id}</strong><br>
        From: ${shipment.origin.name}<br>
        To: ${shipment.destination.name}<br>
        Status: ${shipment.status}
      `);
      
      markers.addLayer(marker);
    });
    
    // Add the cluster group to the map
    map.addLayer(markers);
    
    // Clean up when component unmounts
    return () => {
      map.removeLayer(markers);
    };
  }, [shipments, map]);
  
  return null;
};

export default ShipmentClusters;
