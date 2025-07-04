// src/components/ServiceBoardComponents/FilterAndSortBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  MenuItem,
  Button,
  Chip,
  Popper,
  ButtonGroup,
  Grow,
  ClickAwayListener,
  MenuList,
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/Sort';
import bannerBackgroundImage from '../../Assets/img/service_board_footprint.jpg';
import FilterDialog from './FilterDialog';

const sortFields = [
  'Post Time',
  'Latest Reply Time',
  'Start Time',
  'End Time'
];

export default function FilterAndSortBar({ filters, setFilters, sortOptions, setSortOptions, onFilterChange }) {
  const navigate = useNavigate();
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [resetFlag, setResetFlag] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const sortAnchorRef = useRef(null);

  const selectedIndex = sortFields.indexOf(sortOptions.by);
  

  const handleFilterApply = () => {
    const newFilters = {
      serviceType: '',
      serviceCategory: '',
      petType: '',
      hasImage: '',
      hasLocation: '',
      hasRealName: '',
      myServicesOnly: false,
    };
  
    selectedOptions.forEach(({ value }) => {
      const [key, val] = value.split(':');
      if (key === 'myServices') {
        newFilters.myServicesOnly = val === 'true';
      } else if (key === 'hasLocation') {
        newFilters.hasLocation = val === 'true';
      } else if (key === 'hasImage') {
        newFilters.hasImage = val === 'true';
      } else if (key === 'hasRealName') {
        newFilters.hasRealName = val === 'true';
      } else {
        newFilters[key] = val;
      }
    });
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(newFilters)) {
      if (value !== '' && value !== false) {
        params.set(key, value);
      }
    }
    
    setResetFlag(false);
    setFilterDialogOpen(false);
    navigate(`/service_filtered?${params.toString()}`);
  };
  

  const handleCancel = () => {
    if (!resetFlag) setLocalFilters(filters);
    setFilterDialogOpen(false);
  };

  const handleReset = () => {
    setSelectedOptions([]); // cancel all selected fields
    setFilters({
      serviceType: '',
      serviceCategory: '',
      petType: '',
      hasImage: '',
      hasLocation: '',
      myServicesOnly: false,
    });
  };
  
  

  const handleSortClick = () => {
    setSortOptions(prev => ({
      ...prev,
      order: prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);
  
  const handleSortToggle = () => setSortMenuOpen((prevOpen) => !prevOpen);
  const handleSortSelect = (event, index) => {
    setSortOptions({ ...sortOptions, by: sortFields[index] });
    setSortMenuOpen(false);
  };
  const handleSortMenuClose = (event) => {
    if (sortAnchorRef.current && sortAnchorRef.current.contains(event.target)) return;
    setSortMenuOpen(false);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* Background image layer with opacity */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${bannerBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 4,
          overflow: 'hidden',
          opacity: 0.5,
          zIndex: 0,
        }}
      />

      {/* Foreground content */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'justify-between',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'nowrap',
          width: '100%',
          height: 40,
          border: '2px dashed #ddd',
          borderRadius: 4,
          p: 0.3,
          maxWidth: '390',
          zIndex: 1,
          overflowX: 'auto'
        }}
      >

        <Chip
          icon={<PetsIcon />}
          label="My posts"
          variant={filters.myServicesOnly ? 'filled' : 'outlined'}
          color={filters.myServicesOnly ? 'primary' : 'secondary'}
          onClick={() => {
            const params = new URLSearchParams({ myServicesOnly: 'true' });
            navigate(`/service_filtered?${params.toString()}`);
          }}
          size="small"
          sx={{ px: 1 }}
        />


        <Chip
          icon={<FilterAltIcon />}
          label="Multi filters"
          variant={filterDialogOpen ? 'filled' : 'outlined'}
          color={filterDialogOpen ? 'primary' : 'secondary'}
          onClick={() => setFilterDialogOpen(true)}
          size="small"
          sx={{px: 1}}
        />

        <ButtonGroup
          variant="outlined"
          size="small"
          ref={sortAnchorRef}
          color='secondary'
          sx={{ 
            borderRadius: 4, 
            height: 28,
          }}
        >
          <Button
            onClick={handleSortClick}
            sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1, height: 28, whiteSpace: 'nowrap' }}
          >
            {`Sort by ${sortOptions.order === 'asc' ? '↑' : '↓'}`}
          </Button>
          <Button
            size="small"
            onClick={handleSortToggle}
            aria-controls={sortMenuOpen ? 'split-button-sort-menu' : undefined}
            aria-expanded={sortMenuOpen ? 'true' : undefined}
            aria-label="select sorting field"
            aria-haspopup="menu"
            sx={{ height: 28, minWidth: '32px' }}
          >
            <SortIcon fontSize="small" />
          </Button>
        </ButtonGroup>

        <Popper
          open={sortMenuOpen}
          anchorEl={sortAnchorRef.current}
          role={undefined}
          transition
          disablePortal
          sx={{ zIndex: 2 }}
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === 'bottom' ? 'center top' : 'center bottom',
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleSortMenuClose}>
                  <MenuList id="split-button-sort-menu" autoFocusItem>
                    {sortFields.map((option, index) => (
                      <MenuItem
                        key={option}
                        selected={index === selectedIndex}
                        onClick={(event) => handleSortSelect(event, index)}
                      >
                        {option}
                      </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>

      <FilterDialog
        open={filterDialogOpen}
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        onReset={handleReset}
        onCancel={handleCancel}
        onApply={handleFilterApply}
      />

    </Box>
  );
}