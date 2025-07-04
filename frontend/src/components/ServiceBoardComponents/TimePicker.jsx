import React from 'react';
import { FormLabel, Grid, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
const FormGrid = styled(Grid)(() => ({
    display: 'flex',
    flexDirection: 'column',
  }));

const getToday = () => new Date().toISOString().split('T')[0];

const TimePicker = ({ formData, handleInputChange }) => {
  const today = getToday();
  const availableStart = formData.availableStart || today;

  return (
    <FormGrid item xs={12} md={6}>
      <FormLabel required>Available Times</FormLabel>
      <TextField
        type="date"
        name="availableStart"
        value={formData.availableStart || ''}
        onChange={handleInputChange}
        required
        size="small"
        sx={{ mb: 1 }}
        inputProps={{min: today}}
      />
      <TextField
        type="date"
        name="availableEnd"
        value={formData.availableEnd || ''}
        onChange={handleInputChange}
        required
        size="small"
        inputProps={{min: availableStart}}
      />
    </FormGrid>
  )
}

export default TimePicker;