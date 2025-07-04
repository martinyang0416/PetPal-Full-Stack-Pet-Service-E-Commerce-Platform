// components/RequestOnlyFields.jsx
import React from 'react';
import { FormLabel, Grid, OutlinedInput, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const AdvancedUserInfoFields = ({ serviceCategory, formData, handleInputChange }) => (
  <>
    {serviceCategory === 'pet_house_sitting' && (
      <>
        <FormGrid item xs={12} md={6}>
          <FormLabel required htmlFor="firstName">Your real first name</FormLabel>
          <OutlinedInput
            id="firstName"
            name="firstName"
            value={formData.firstName || ''}
            onChange={handleInputChange}
            required
            size="small"
          />
        </FormGrid>
        <FormGrid item xs={12} md={6}>
          <FormLabel required htmlFor="lastName">Your real last name</FormLabel>
          <OutlinedInput
            id="lastName"
            name="lastName"
            value={formData.lastName || ''}
            onChange={handleInputChange}
            required
            size="small"
          />
        </FormGrid>
      </>
    )}
  </>
);

export default AdvancedUserInfoFields
