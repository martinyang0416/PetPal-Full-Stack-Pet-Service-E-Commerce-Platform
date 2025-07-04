// components/MapConsent.jsx
import React from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  Popover,
  Typography
} from '@mui/material';
import { 
    Help as HelpIcon
  } from '@mui/icons-material';
import MapPicker from './MapPicker';
import { styled } from '@mui/material/styles';

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const MapConsent = ({
  serviceType,
  serviceCategory,
  mapPickerAgreement,
  setMapPickerAgreement,
  handleAddressSelect,
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleHelpClick = (e) => setAnchorEl(e.currentTarget);
  const handleHelpClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);


  return (
    <>
      {((serviceCategory === 'pet_house_sitting' && serviceType === 0) || 
        (serviceCategory === 'pet_daycare' && serviceType === 1)) ? (
        <FormGrid item size={12}>
          <FormLabel required>Service location</FormLabel>
          <MapPicker onAddressSelect={handleAddressSelect} />
        </FormGrid>
      ) : (
        <>
          <FormGrid item xs={12}>
            <Box display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={mapPickerAgreement}
                    onChange={(e) => setMapPickerAgreement(e.target.checked)}
                  />
                }
                label="I agree to share my location"
              />
              <IconButton size="small" onClick={handleHelpClick}>
                <HelpIcon fontSize="small" />
              </IconButton>
            </Box>
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handleHelpClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, maxWidth: 250 }}>
                <Typography variant="body2">
                  Location info is recommended for a more efficient match and more exposure in the service board.
                </Typography>
              </Box>
            </Popover>
          </FormGrid>
          {mapPickerAgreement && (
            <FormGrid item size={12}>
              <FormLabel required>Service location</FormLabel>
              <MapPicker onAddressSelect={handleAddressSelect} />
            </FormGrid>
          )}
        </>
      )}
    </>
  );
};

export default MapConsent;
