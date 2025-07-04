// ServiceDetailForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Typography,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import UserInfoFields from './UserInfoFields';
import PetInfoFields from './PetInfoFields';
import AdvancedUserInfoFields from './AdvancedUserInfoFields';
import TimePicker from './TimePicker';
import MapConsent from './MapConsentField';


const categoryToStringMap = {
  'pet_spa': 'Pet Spa',
  'pet_walking': 'Pet Walking',
  'pet_daycare': 'Pet Daycare',
  'pet_house_sitting': 'Door-to-Door Pet Sitting',
};

const dogBreedNameMap = {
  "germanshepherd": "German Shepherd",
  "shihtzu": "Shih Tzu",
  "bullterrier": "Bull Terrier",
  "cotondetulear": "Coton de Tulear",
  "germanshepherd": "German Shepherd",
  "mexicanhairless": "Mexican Hairless",
};


const ServiceDetailForm = ({ serviceType, serviceCategory, formData, setFormData }) => {
  const isRequest = serviceType === 0;
  const isOffer = serviceType === 1;
  const displayCategory = categoryToStringMap[serviceCategory] || serviceCategory;
  const [mapPickerAgreement, setMapPickerAgreement] = useState(false);

  const capitalizeWords = (str) =>
    str
      .split(/[\s-]/) // split on space or hyphen if any
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  

  const [breedOptions, setBreedOptions] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (file) => {
    setFormData({ ...formData, petImage: file });
  };

  const handleAddressSelect = (locationData) => {
    setFormData((prev) => ({
      ...prev,
      location: locationData.place_name,
      coordinates: locationData.coordinates,
    }));
  };

  const parseDogBreeds = (data) => {
    const result = [];
  
    Object.entries(data.message).forEach(([breed, subBreeds]) => {
      if (subBreeds.length === 0) {
        // No sub-breeds: use dictionary or fallback
        const label = dogBreedNameMap[breed] || capitalizeWords(breed);
        // console.log("Label:", label);
        result.push({ label, value: breed });
      } else {
        subBreeds.forEach((sub) => {
          // e.g., "blenheim spaniel"
          const fullKey = `${sub} ${breed}`;
          const label =
            dogBreedNameMap[fullKey] ||
            `${capitalizeWords(sub)} ${dogBreedNameMap[breed] || capitalizeWords(breed)}`;
          const value = `${sub}-${breed}`;
          result.push({ label, value });
        });
      }
    });
  
    return result.sort((a, b) => a.label.localeCompare(b.label));
  };
  

  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        if (formData.petType === 'dog') {
          const res = await fetch('https://dog.ceo/api/breeds/list/all');
          const data = await res.json();
          const breeds = parseDogBreeds(data);
          setBreedOptions(breeds);
        } else if (formData.petType === 'cat') {
          const res = await axios.get('https://api.thecatapi.com/v1/breeds',
            {withCredentials: false}
          );
          const breeds = res.data.map((b) => ({
            label: b.name,
            value: b.name,
          }));
          setBreedOptions(breeds);
        } else {
          setBreedOptions([]);
        }
      } catch (err) {
        console.error("Failed to fetch breed list:", err);
        setBreedOptions([]);
      }
    };
  
    if (formData.petType) {
      fetchBreeds();
      setFormData((prev) => ({ ...prev, petBreed: '' })); // Reset breed when switching species
    }
  }, [formData.petType]);
  

  return (
    <Box sx={{ p: 2, maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h6" gutterBottom>
        Create a {displayCategory} service {isRequest ? 'request' : 'offer'}
      </Typography>

      <Grid container spacing={2}>
        <UserInfoFields formData={formData} handleInputChange={handleInputChange} />

        <PetInfoFields
          isRequest={isRequest}
          isOffer={isOffer}
          formData={formData}
          handleInputChange={handleInputChange}
          breedOptions={breedOptions}
          handleImageUpload={handleImageUpload}
        />

        <AdvancedUserInfoFields
          serviceCategory={serviceCategory}
          formData={formData}
          handleInputChange={handleInputChange}
        />
        <TimePicker
          formData={formData}
          handleInputChange={handleInputChange}
        />
        <MapConsent
          serviceType={serviceType}
          serviceCategory={serviceCategory}
          mapPickerAgreement={mapPickerAgreement}
          setMapPickerAgreement={setMapPickerAgreement}
          handleAddressSelect={handleAddressSelect}
        />
        <Grid item size={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            placeholder="Leave your additional notes here"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServiceDetailForm;
