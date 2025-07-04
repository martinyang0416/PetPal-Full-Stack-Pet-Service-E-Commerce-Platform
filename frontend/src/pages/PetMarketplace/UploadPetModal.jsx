import React, { useState } from "react";
import "./PetMarketplace.css";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  InputLabel,
  MenuItem,
  Select,
  FormControl,
  Divider,
  Alert,
} from "@mui/material";
import CustomMapPicker from "../../components/CustomMapPicker";

const UploadPetModal = ({ open, onClose, onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    condition: "",
    price: "",
    location: { lat: null, lng: null },
    image: null,
  });

  const [errors, setErrors] = useState({
    price: false,
    location: false,
  });
  
  const [imageUploaded, setImageUploaded] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImageUploaded(true);
      // Auto-hide the success message after 3 seconds
      setTimeout(() => {
        setImageUploaded(false);
      }, 3000);
    }
  };

  const handleLocationSelect = (locationData) => {
    console.log("📍 Selected location:", locationData);
    setFormData((prev) => ({
      ...prev,
      location: {
        lat: locationData.lat,
        lng: locationData.lng,
        place_name: locationData.place_name,
        formatted: locationData.formatted
      }
    }));
    // Clear the previous position error
    setErrors(prev => ({ ...prev, location: false }));
  };

  const handleSubmit = async () => {
    const price = parseFloat(formData.price);
    
    // Verify the price and location
    const isValidPrice = !isNaN(price) && price >= 0;
    const isValidLocation = 
      formData.location && 
      formData.location.lat !== null && 
      formData.location.lng !== null;

    setErrors({
      price: !isValidPrice,
      location: !isValidLocation,
    });

    if (!isValidPrice || !isValidLocation) {
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    form.append("type", formData.type);
    form.append("condition", formData.condition);
    form.append("price", price);
    
    const locationData = { 
      lat: formData.location.lat, 
      lng: formData.location.lng 
    };
    console.log("📍 Uploading location:", locationData);
    form.append("location", JSON.stringify(locationData));
    
    if (formData.image) form.append("image", formData.image);

    try {
      const res = await fetch("http://localhost:5000/pets/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Pet uploaded!");
        onUploadSuccess();
        onClose();
      } else {
        alert("❌ Upload failed: " + data.msg);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ Upload failed due to network or server error.");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 500,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" mb={2}>
          Upload New Pet Item
        </Typography>

        <TextField
          label="Name"
          name="name"
          fullWidth
          margin="dense"
          value={formData.name}
          onChange={handleChange}
        />

        <FormControl fullWidth margin="dense">
          <InputLabel>Type</InputLabel>
          <Select
            name="type"
            value={formData.type}
            onChange={handleChange}
            label="Type"
          >
            <MenuItem value="toy">Toy</MenuItem>
            <MenuItem value="food">Food</MenuItem>
            <MenuItem value="accessory">Accessory</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Condition"
          name="condition"
          fullWidth
          margin="dense"
          value={formData.condition}
          onChange={handleChange}
        />

        <TextField
          label="Price"
          name="price"
          type="number"
          fullWidth
          margin="dense"
          value={formData.price}
          onChange={handleChange}
          inputProps={{ min: 0 }}
          helperText={errors.price ? "Price must be 0 or more" : ""}
          error={errors.price}
        />

        <Box my={2}>
          <Typography variant="subtitle1" gutterBottom>
            Location
          </Typography>
          <CustomMapPicker onLocationSelect={handleLocationSelect} />
          {formData.location.place_name && (
            <Typography variant="body2" color="primary" mt={1}>
              Selected Location: {formData.location.place_name}
            </Typography>
          )}
          {formData.location.formatted && (
            <Typography variant="body2" color="text.secondary" mt={0.5} fontSize="0.7rem">
              Coordinates: {formData.location.formatted}
            </Typography>
          )}
          {errors.location && (
            <Typography variant="body2" color="error">
              Please select a location on the map
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {imageUploaded && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Image uploaded successfully!
          </Alert>
        )}

        <Button variant="outlined" component="label" fullWidth sx={{ my: 1 }}>
          {formData.image ? `Selected image: ${formData.image.name}` : "Upload Image"}
          <input type="file" accept="image/*" hidden onChange={handleFileChange} />
        </Button>

        <Button fullWidth variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
          Submit
        </Button>
      </Box>
    </Modal>
  );
};

export default UploadPetModal;
