// components/PetInfoFields.jsx
import React from 'react';
import { FormLabel, Grid, MenuItem, OutlinedInput, Select } from '@mui/material';
import { styled } from '@mui/material/styles';
import ImageUpload from './ImageUpload';

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const PetInfoFields = ({ isRequest, isOffer, formData, handleInputChange, breedOptions, handleImageUpload }) => (
  <>
    {(isRequest || isOffer) && (
      <FormGrid item xs={12} md={6}>
        <FormLabel required>Pet Type</FormLabel>
        <Select
          value={formData.petType || ''}
          name="petType"
          onChange={handleInputChange}
          size="small"
          required
        >
          {isOffer && <MenuItem value="either">Either works</MenuItem>}
          <MenuItem value="dog">Dog</MenuItem>
          <MenuItem value="cat">Cat</MenuItem>
        </Select>
      </FormGrid>
    )}

    {isRequest && (
      <>
        <FormGrid item xs={12} md={6}>
          <FormLabel required htmlFor="petName">Your pet's name</FormLabel>
          <OutlinedInput
            id="petName"
            name="petName"
            value={formData.petName || ''}
            onChange={handleInputChange}
            required
            size="small"
          />
        </FormGrid>

        {formData.petType && (
          <FormGrid item xs={12} md={6}>
            <FormLabel>Pet Breed (Optional)</FormLabel>
            <Select
              value={formData.petBreed || ''}
              name="petBreed"
              onChange={handleInputChange}
              size="small"
              displayEmpty
            >
              <MenuItem value="">None</MenuItem>
              {breedOptions.map(({ label, value }) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormGrid>
        )}

        <FormGrid item xs={12} md={6}>
          <FormLabel>Pet image (optional)</FormLabel>
          <ImageUpload onImageUpload={handleImageUpload} />
        </FormGrid>
      </>
    )}
  </>
);

export default PetInfoFields;
