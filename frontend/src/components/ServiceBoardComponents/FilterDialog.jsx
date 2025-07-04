// components/FilterAndSortBar/FilterDialog.jsx

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
} from '@mui/material';
import { styled, lighten } from '@mui/system';

const GroupHeader = styled('div')(() => {
  const bgColor = lighten('#90caf9', 0.85);

  return {
    position: 'sticky',
    top: '-8px',
    padding: '4px 10px',
    color: '#1976d2',
    backgroundColor: bgColor,
  };
});


const GroupItems = styled('ul')({
  padding: 0,
});

// Filter option definitions
const groupedFilterOptions = [
  { group: 'Service Type', label: 'request', value: 'serviceType:request' },
  { group: 'Service Type', label: 'offer', value: 'serviceType:offer' },

  { group: 'Service Category', label: 'pet walking', value: 'serviceCategory:pet_walking' },
  { group: 'Service Category', label: 'pet spa', value: 'serviceCategory:pet_spa' },
  { group: 'Service Category', label: 'pet daycare', value: 'serviceCategory:pet_daycare' },
  { group: 'Service Category', label: 'pet door-to-door sitting', value: 'serviceCategory:pet_house_sitting' },

  { group: 'Pet Type', label: 'dog', value: 'petType:dog' },
  { group: 'Pet Type', label: 'cat', value: 'petType:cat' },
  { group: 'Pet Type', label: 'all', value: 'petType:all' },

  { group: 'Has Location', label: 'true', value: 'hasLocation:true' },
  { group: 'Has Location', label: 'false', value: 'hasLocation:false' },

  { group: 'Has Real Name', label: 'true', value: 'hasRealName:true' },
  { group: 'Has Real Name', label: 'false', value: 'hasRealName:false' },

  { group: 'My Services', label: 'true', value: 'myServices:true' },
  { group: 'My Services', label: 'false', value: 'myServices:false' },
];

const FilterDialog = ({
  open,
  selectedOptions,
  setSelectedOptions,
  onReset,
  onCancel,
  onApply,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth>
      <DialogTitle>Filter Services</DialogTitle>
      <DialogContent dividers>
        <Autocomplete
          multiple
          id="filter-tags"
          options={groupedFilterOptions}
          groupBy={(option) => option.group}
          getOptionLabel={(option) => option.label}
          filterSelectedOptions
          value={selectedOptions}
          onChange={(event, newValue) => setSelectedOptions(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter Options"
              placeholder="Choose filters"
            />
          )}
          renderGroup={(params) => (
            <li key={params.key}>
              <GroupHeader>{params.group}</GroupHeader>
              <GroupItems>{params.children}</GroupItems>
            </li>
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onReset}>Reset</Button>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onApply} variant="contained">Apply</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterDialog;
