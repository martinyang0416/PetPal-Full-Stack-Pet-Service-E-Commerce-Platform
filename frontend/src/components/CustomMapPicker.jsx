import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Box, Typography, CircularProgress } from "@mui/material";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const CustomMapPicker = ({ onLocationSelect, initialCenter }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get address from coordinates using Mapbox Geocoding API
  const getAddressFromCoordinates = async (lng, lat) => {
    try {
      const token = 'pk.eyJ1IjoibW9uYWZhbjEwMjkiLCJhIjoiY205dDV0c2RhMDcxczJrcTRnOWV2c3dzYyJ9.rVV2yssLHdXoyAiWbkAG_A';
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=en`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      return "Unknown location";
    } catch (err) {
      console.error("Error getting address:", err);
      return "Unknown location";
    }
  };

  // Initialize the map only once when component mounts
  useEffect(() => {
    // Get Mapbox token
    const token = 'pk.eyJ1IjoibW9uYWZhbjEwMjkiLCJhIjoiY205dDV0c2RhMDcxczJrcTRnOWV2c3dzYyJ9.rVV2yssLHdXoyAiWbkAG_A';
    mapboxgl.accessToken = token;
    
    // Default to US center if no initial center is provided
    const defaultCenter = initialCenter || [-95.7129, 37.0902];
    
    try {
      // Create map instance
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCenter,
        zoom: initialCenter ? 14 : 4
      });
      
      // Store map reference
      mapRef.current = map;
      
      // Create geocoder (search box)
      const geocoder = new MapboxGeocoder({
        accessToken: token,
        mapboxgl: mapboxgl,
        marker: false, // We'll handle markers ourselves
        countries: 'us',
        language: 'en',
        placeholder: 'Search address...'
      });
      
      // Wait for map to load
      map.on('load', () => {
        console.log("Map loaded successfully");
        setLoading(false);
        
        // Add initial marker 
        const marker = new mapboxgl.Marker({ color: '#9F7AEA' })
          .setLngLat(defaultCenter)
          .addTo(map);
        
        // Store marker reference
        markerRef.current = marker;
          
        // Pass initial location data back if we have initialCenter
        if (initialCenter) {
          // Get address for initial center
          getAddressFromCoordinates(initialCenter[0], initialCenter[1])
            .then(address => {
              onLocationSelect({
                lng: initialCenter[0],
                lat: initialCenter[1],
                place_name: address,
                formatted: `${initialCenter[1].toFixed(6)}, ${initialCenter[0].toFixed(6)}`
              });
            });
        }
      });
      
      // Handle map click
      map.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        
        // Update marker position
        markerRef.current.setLngLat([lng, lat]);
        
        // Get address for clicked location
        const address = await getAddressFromCoordinates(lng, lat);
        
        // Pass location data back
        onLocationSelect({
          lng,
          lat,
          place_name: address,
          formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      });
      
      // Handle geocoder result
      geocoder.on('result', (e) => {
        console.log("Search result selected:", e.result);
        
        // Get coordinates and place name
        const lng = e.result.center[0];
        const lat = e.result.center[1];
        const placeName = e.result.place_name;
        
        // Fly to location
        map.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true
        });
        
        // Update marker position
        markerRef.current.setLngLat([lng, lat]);
        
        // Pass location data back
        onLocationSelect({
          lng,
          lat,
          place_name: placeName,
          formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      });
      
      // Add controls to map
      map.addControl(geocoder, 'top-left');
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add geolocate control with modified events
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      });
      
      map.addControl(geolocateControl, 'top-right');
      
      // Handle location found by geolocate control
      map.on('geolocate', async (e) => {
        const position = e.coords;
        const lng = position.longitude;
        const lat = position.latitude;
        
        // If marker exists, update its position
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        }
        
        // Get address for current location
        const address = await getAddressFromCoordinates(lng, lat);
        
        // Pass location data back with address
        onLocationSelect({
          lng,
          lat,
          place_name: address,
          formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      });
      
      // Cleanup function
      return () => {
        if (map) map.remove();
      };
    } catch (err) {
      console.error("Map error:", err);
      setError("Unable to load map. Please check your connection and try again.");
      setLoading(false);
    }
  }, []); // Only run once on mount

  // Handle changes to initialCenter prop
  useEffect(() => {
    if (!initialCenter || !mapRef.current || !markerRef.current) return;
    
    console.log("initialCenter changed:", initialCenter);
    
    // Fly to the new center
    mapRef.current.flyTo({
      center: initialCenter,
      zoom: 14,
      essential: true
    });
    
    // Update marker position
    markerRef.current.setLngLat(initialCenter);
    
    // Get address for new center
    getAddressFromCoordinates(initialCenter[0], initialCenter[1])
      .then(address => {
        // Pass location data back
        onLocationSelect({
          lng: initialCenter[0],
          lat: initialCenter[1],
          place_name: address,
          formatted: `${initialCenter[1].toFixed(6)}, ${initialCenter[0].toFixed(6)}`
        });
      });
    
  }, [initialCenter]);

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      {loading && (
        <Box sx={{ 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)",
          zIndex: 10
        }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Box sx={{ 
          p: 2, 
          bgcolor: "#fee2e2", 
          color: "#ef4444",
          borderRadius: "8px",
          mb: 2
        }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}
      
      <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
        Enter address to search, click on map to select location, or use location button
      </Typography>
      
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: "100%", 
          height: "30vh", 
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
          overflow: "hidden"
        }} 
      />
    </Box>
  );
};

export default CustomMapPicker; 