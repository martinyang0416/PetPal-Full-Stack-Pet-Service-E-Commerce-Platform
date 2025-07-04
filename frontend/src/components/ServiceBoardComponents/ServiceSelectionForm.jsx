import * as React from 'react';
import {
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Grid,
    MenuItem,
    Select,
    Switch,
    Typography,
    Paper,
    InputLabel,
} from '@mui/material';

import { styled } from '@mui/material/styles';

import selectionFormRequestIcon from '../../Assets/img/service_creation_form_request_icon.png';
import selectionFormOfferIcon from '../../Assets/img/service_creation_form_offer_icon.png';

{/*
This page only contains two columns. 
On the left hand side is the selection between 1) service request and 2) service offer.
On the right hand side is the selection between service categories, including 1) pet spa, 2) pet walking, 3) pet daycare, and 4) pet door-to-door sitting.
Following pages to create service request or service offer will be based on the selection here.
*/}

const CustomRequestOfferSwitch = styled(Switch)(() => ({
  width: 100,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#000',
      transform: 'translateX(68px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url(${selectionFormOfferIcon})`, // offer icon
      },
      '& + .MuiSwitch-track': {
        backgroundColor: '#9fa8da',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#ffffff',
    width: 32,
    height: 32,
    '&::before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url(${selectionFormRequestIcon})`, // request icon
    },
  },
  '& .MuiSwitch-track': {
    borderRadius: 46 / 2,
    backgroundColor: '#90caf9',
    opacity: 1,
  },
}));

export default function ServiceSelectionForm({ formData, setFormData }) {
  const isOffer = formData.serviceType === 1;

  const handleTypeChange = (event) => {
    const checked = event.target.checked;
    // console.log('Service type changed:', checked);
    setFormData((prev) => ({ ...prev, serviceType: checked ? 1 : 0 }));
    // console.log('Form data updated:', formData.service_type);
  };

  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;
    // console.log('Service category changed:', newCategory);
    if (newCategory !== null) {
      setFormData((prev) => ({ ...prev, serviceCategory: newCategory }));
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={4} alignItems="center">
      {/* Service Type Selection */}
      <Paper sx={{ width: '100%', maxWidth: 600, p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Select Service Type
        </Typography>

        <FormControlLabel
          control={
            <CustomRequestOfferSwitch checked={isOffer} onChange={handleTypeChange} />
          }
          label={isOffer ? 'Offering a Service' : 'Requesting a Service'}
          labelPlacement="top"
          sx={{ mb: 2 }}
        />

        <Typography variant="body1">
          {isOffer
            ? 'I am providing pet care service!'
            : 'I am looking for caregivers for my pet!'}
        </Typography>
      </Paper>

      {/* Service Category Selection */}
      <Paper sx={{ width: '100%', p: 4, textAlign: 'left' }}>
        <Typography variant="h6" gutterBottom>
          Choose Service Category
        </Typography>
        <Box mt={2}>
          <FormControl sx={{ display: 'flex', minWidth: 120, alignItems: 'flex-start', justifyContent: 'center', flexDirection: 'column' }}>
            <InputLabel htmlFor="service-category-select-label" required>
              Service Category
            </InputLabel>
            <Select
              labelId="service-category-select-label"
              value={formData.serviceCategory}
              onChange={
                handleCategoryChange
              }
              sx={{ width: '80%' }}
              label="Service Category"
              // defaultValue={defaultCategory}
              id="service-category-select"
              // displayEmpty
            >
              <MenuItem value="pet_spa">Pet Spa</MenuItem>
              <MenuItem value="pet_walking">Pet Walking</MenuItem>
              <MenuItem value="pet_daycare">Pet Daycare</MenuItem>
              <MenuItem value="pet_house_sitting">Door-to-Door Sitting</MenuItem>
            </Select>
            <FormHelperText> Required </FormHelperText>
          </FormControl>
          
        </Box>
      </Paper>
    </Box>
  );
}
