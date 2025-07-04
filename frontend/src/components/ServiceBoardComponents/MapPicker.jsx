// MapPicker.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button, Box } from "@mui/material";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const MapPicker = ({ onAddressSelect }) => {
    const mapRef = useRef();
    const mapContainerRef = useRef();
    const geocoderRef = useRef();
    const mapBoxToken = process.env.REACT_APP_MAPBOX_TOKEN;
    // console.log("MapBox Token:", mapBoxToken);

    useEffect(() => {
        mapboxgl.accessToken = mapBoxToken;

        // Initialize the map
        mapRef.current = new mapboxgl.Map({
            center: [116.391276, 39.906217],
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v12",
            zoom: 12,
        });

        // Create geocoder for auto-complete locaion
        geocoderRef.current = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
        });

        // log the marker placed by the geocoder
        geocoderRef.current.on("result", (e) => {
            const locationData = {
                place_name: e.result.place_name,
                coordinates: e.result.center,
            };
            onAddressSelect(locationData);
            console.log("🟡 Location selected:", e.result);
            console.log("Coordinates:", e.result.center);
        });

        mapRef.current.addControl(geocoderRef.current, "top-left");

        // To locate the user
        mapRef.current.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true,
                },
                trackUserLocation: true,
                showUserHeading: true,
            })
        );

        return () => {
            mapRef.current.remove();
        };
    }, []);

    return (
        <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            width: "100%", 
            height: "30vh",
            aspectRatio: "1",
            borderRadius: "12px",
            overflow: "hidden",}}>
            <div ref={mapContainerRef} style={{ height: "100%" }} />
        </div>
    );
};

export default MapPicker;
