// src/pages/PetMarketplace/PetMarketplace.jsx
import React, { useEffect, useState } from "react";
import {
  Grid,
  Button,
  Box,
  Slider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Typography,
  CircularProgress,
  CardMedia,
} from "@mui/material";
import PetItemCard from "./PetItemCard";
import UploadPetModal from "./UploadPetModal";

const PetMarketplace = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 100 });
  

  const [formData, setFormData] = useState({
    type: "",
    priceRange: [0, 100],
    distance: 5,
    location: { lat: 0, lng: 0, place_name: "" },
  });
  const [openFilter, setOpenFilter] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const currentUser = localStorage.getItem("userId") || "guest-user";
  const currentUserName = localStorage.getItem("username") || "Guest";

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

  useEffect(() => {
    fetch("http://localhost:5000/pets/")
      .then((r) => r.json())
      .then((data) => {
        setPets(data);
        setLoading(false);

        // Only keep prices that can be converted to numbers
        const numericPrices = data
          .map((p) => Number(p.price))
          .filter((p) => !isNaN(p));

        if (numericPrices.length > 0) {
          const min = Math.min(...numericPrices);
          const max = Math.max(...numericPrices);

          setPriceBounds({ min, max });
          // Sync update slider initial value
          setFormData((fd) => ({
            ...fd,
            priceRange: [min, max],
          }));
        }
      })
      .catch(() => {
        setLoading(false);
        alert("The initial data cannot be loaded. Please try again later");
      });
  }, []);

  // Apply filters
  const applyFilters = () => {
    const { type, priceRange, distance, location } = formData;
    const params = new URLSearchParams();

    if (type) params.append("type", type);
    params.append("min_price", priceRange[0]);
    params.append("max_price", priceRange[1]);

    if (location.lat && location.lng) {
      params.append("lat", location.lat);
      params.append("lng", location.lng);
      params.append("distance", distance);
    }

    setLoading(true);
    fetch(`http://localhost:5000/pets/?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setPets(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert("Request Failed, Please Try Again Later");
      });
  };

  // Reset filters and get all items
  const resetAndShowAll = () => {
    setFormData({
      type: "",
      priceRange: [priceBounds.min, priceBounds.max],
      distance: 5,
      location: { lat: 0, lng: 0, place_name: "" },
    });
    setOpenFilter(null);
    
    setLoading(true);
    fetch("http://localhost:5000/pets/")
      .then((r) => r.json())
      .then((data) => {
        setPets(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert("Request Failed, Please Try Again Later");
      });
  };

  // Get current user location with address
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        // Get address for current location
        const address = await getAddressFromCoordinates(lng, lat);
        
        setFormData({
          ...formData,
          location: {
            lat: lat,
            lng: lng,
            place_name: address
          },
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please check your browser permissions.");
        setLocationLoading(false);
      }
    );
  };

  return (
    <div className="p-4 bg-pink-50 min-h-screen">
      {/* Banner */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          mb: 4,
        }}
      >
        <CardMedia
          component="img"
          height="220"
          image="/image/banner_pet_market.jpg"
          alt="Pet Marketplace Banner"
        />
        <Box
          sx={{
            position: "absolute",
            top: "20%",
            left: "10%",
            color: "white",
            textShadow: "1px 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          <Typography variant="h4" fontWeight="bold">
            Love, Reused
          </Typography>
          <Typography variant="subtitle1">
            Giving Pre-Loved Pet Items A New Home! 💙
          </Typography>
        </Box>
      </Box>

      {/* -------- Filter Capsules + My Message --------*/}
      <Box className="flex gap-3 justify-center mb-4">
        {["price","type","distance"].map(f => (
          <Button key={f} variant="contained"
            sx={{ borderRadius:"9999px", bgcolor:"#9F7AEA" }}
            onClick={() => setOpenFilter(openFilter===f ? null : f)}>
            {f==="price"?"Price Range":f==="type"?"Product Type":"Distance"}
          </Button>
        ))}
      </Box>


      {/* Price Slider */}
      {openFilter === "price" && (
        <Box
          sx={{
            maxWidth: 240,
            mx: "auto",
            mb: 4,
            p: 2,
            bgcolor: "#fff",
            boxShadow: 1,
          }}
        >
          <Typography gutterBottom>
            Price: ${formData.priceRange[0]} - ${formData.priceRange[1]}
          </Typography>
          <Slider
            value={formData.priceRange}
            min={priceBounds.min}
            max={priceBounds.max}
            onChange={(_, v) => setFormData({ ...formData, priceRange: v })}
            valueLabelDisplay="auto"
          />
        </Box>
      )}

      {/* Type Select */}
      {openFilter === "type" && (
        <Box
          sx={{
            maxWidth: 240,
            mx: "auto",
            mb: 4,
            p: 2,
            bgcolor: "#fff",
            boxShadow: 1,
          }}
        >
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="toy">Toy</MenuItem>
              <MenuItem value="food">Food</MenuItem>
              <MenuItem value="accessory">Accessory</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Distance Picker */}
      {openFilter === "distance" && (
        <Box
          sx={{
            maxWidth: 240,
            mx: "auto",
            mb: 4,
            p: 2,
            bgcolor: "#fff",
            boxShadow: 1,
          }}
        >
          <Typography gutterBottom>
            Distance: {formData.distance} km
          </Typography>
          <Slider
            value={formData.distance}
            min={0}
            max={20}
            onChange={(_, v) => setFormData({ ...formData, distance: v })}
            valueLabelDisplay="auto"
            disabled={!formData.location.lat}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={getCurrentLocation}
            disabled={locationLoading}
            sx={{ mt: 1 }}
          >
            {locationLoading ? "Loading..." : "📍 Get My Location"}
          </Button>
          {formData.location.lat ? (
            <>
              <Typography sx={{ mt: 1, textAlign: "center", fontWeight: "bold" }}>
                {formData.location.place_name}
              </Typography>
              <Typography variant="caption" sx={{ textAlign: "center", display: "block", mt: 0.5, color: "text.secondary" }}>
                {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
              </Typography>
            </>
          ) : (
            <Typography
              color="error"
              sx={{ mt: 1, textAlign: "center" }}
            >
              Please get your location first
            </Typography>
          )}
        </Box>
      )}

      {/* Apply Filters Button */}
      {openFilter && (
        <Box className="text-center mb-6">
          <Button variant="contained" onClick={applyFilters}>
            Apply Filters
          </Button>
        </Box>
      )}

      {/* Filter Summary */}
      <Box className="text-center mb-4 text-sm text-grey-700">
        <Typography variant="body2" color="text.secondary">
          <strong>Selected:</strong> {formData.type || "All Types"} | $
          {formData.priceRange[0]}-{formData.priceRange[1]} |{" "}
          {formData.location.lat
            ? `Within ${formData.distance} km of ${formData.location.place_name || "your location"}`
            : "Any distance"}
        </Typography>
      </Box>

      {/* Pet Cards / Loading / No Data */}
      {loading ? (
        <Box className="flex justify-center mt-8">
          <CircularProgress />
        </Box>
      ) : pets.length ? (
        <Grid container spacing={2}>
          {pets.map((pet) => (
            <Grid item xs={12} sm={6} md={3} key={pet._id}>
              <PetItemCard pet={pet} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary" mb={2}>
            No data found for the current filters. Please adjust the type or price.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={resetAndShowAll}
            sx={{ backgroundColor: "#9F7AEA" }}
          >
            Show All Items
          </Button>
        </Box>
      )}

      <UploadPetModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={applyFilters}
      />
      <Box
        className="floating-upload-button"
        onClick={() => setShowUploadModal(true)}
      >
        +
      </Box>
    </div>
  );
};

export default PetMarketplace;
