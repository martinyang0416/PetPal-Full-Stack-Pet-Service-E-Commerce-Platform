import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, Button, 
  Grid, Divider, Card, CardContent, Chip, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, Alert, 
  TextField, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, Avatar
} from '@mui/material';
import { 
  Schedule as ScheduleIcon, 
  LocationOn as LocationIcon,
  Today as TodayIcon,
  AccessTime as TimeIcon,
  EventAvailable as AvailableIcon,
  EventBusy as UnavailableIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import axios from 'axios';

// Styled components
const TimeSlotButton = styled(Button)(({ theme, selected, available }) => ({
  width: '100%',
  marginBottom: theme.spacing(1),
  color: available ? (selected ? theme.palette.primary.contrastText : theme.palette.text.primary) : theme.palette.text.disabled,
  backgroundColor: available 
    ? (selected ? theme.palette.primary.main : theme.palette.background.default) 
    : theme.palette.action.disabledBackground,
  '&:hover': {
    backgroundColor: available 
      ? (selected ? theme.palette.primary.dark : theme.palette.action.hover) 
      : theme.palette.action.disabledBackground
  },
  border: `1px solid ${available 
    ? (selected ? theme.palette.primary.main : theme.palette.divider) 
    : theme.palette.action.disabledBackground}`,
}));

// Day of week options
const DAYS_OF_WEEK = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

// Time slots
const TIME_SLOTS = [
  { value: 'Morning', label: 'Morning (9AM - 12PM)' },
  { value: 'Afternoon', label: 'Afternoon (1PM - 5PM)' },
  { value: 'Evening', label: 'Evening (6PM - 9PM)' },
];

const VetSchedule = () => {
  const { id } = useParams(); // Changed from vetId to id to match the route parameter name
  const navigate = useNavigate();
  const location = useLocation();
  
  // States
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0].value);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Get user data from local storage
  const getUserFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  };

  // Fetch vet data and availability
  useEffect(() => {
    const fetchVetData = async () => {
      if (!id) {
        setError('Veterinarian ID not specified. Please go back and select a veterinarian.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Use local API endpoint only
        const apiUrl = `/api/vets/${id}`;
        
        const response = await axios.get(apiUrl);
        const vetData = response.data;
        setVet(vetData);
        
        // Generate available time slots based on vet's availability
        if (vetData.availability) {
          if (Array.isArray(vetData.availability)) {
            updateAvailableTimeSlots(selectedDay, vetData.availability);
          } else {
            // If availability is in object format (day_time: boolean)
            const formattedAvailability = formatObjectAvailability(vetData.availability);
            updateAvailableTimeSlots(selectedDay, formattedAvailability);
          }
        } else {
          setAvailableTimeSlots([]);
        }
      } catch (err) {
        console.error('Error fetching vet data:', err);
        setError('Failed to load veterinarian information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchVetData();
  }, [id, selectedDay]);

  // Format availability object to an array format
  const formatObjectAvailability = (availabilityObj) => {
    if (!availabilityObj) return [];
    
    const formattedAvailability = [];
    
    // Group by day
    const dayMap = {};
    Object.entries(availabilityObj).forEach(([slot, isAvailable]) => {
      if (isAvailable) {
        const [day, time] = slot.split('_');
        if (!dayMap[day]) {
          dayMap[day] = [];
        }
        dayMap[day].push(time);
      }
    });
    
    // Convert to array format
    Object.entries(dayMap).forEach(([day, slots]) => {
      formattedAvailability.push({ day, slots });
    });
    
    return formattedAvailability;
  };

  // Update available time slots based on selected day
  const updateAvailableTimeSlots = (day, availability) => {
    if (!availability) return;
    
    // If availability is in array format
    if (Array.isArray(availability)) {
      // Find availability for the selected day
      const dayAvailability = availability.find(a => a.day === day);
      
      if (dayAvailability && dayAvailability.slots) {
        setAvailableTimeSlots(dayAvailability.slots);
      } else {
        // If no specific availability for this day, assume no slots available
        setAvailableTimeSlots([]);
      }
    } 
    // If availability is in object format (day_time: boolean)
    else {
      const availableSlots = [];
      
      TIME_SLOTS.forEach(slot => {
        const key = `${day}_${slot.value}`;
        if (availability[key]) {
          availableSlots.push(slot.value);
        }
      });
      
      setAvailableTimeSlots(availableSlots);
    }
  };

  // Handle day selection change
  const handleDayChange = (event) => {
    const newDay = event.target.value;
    setSelectedDay(newDay);
    
    // Reset selection
    setSelectedTimeSlot('');
    
    if (vet && vet.availability) {
      if (Array.isArray(vet.availability)) {
        updateAvailableTimeSlots(newDay, vet.availability);
      } else {
        updateAvailableTimeSlots(newDay, vet.availability);
      }
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelection = (timeSlot) => {
    const newSelection = timeSlot === selectedTimeSlot ? '' : timeSlot;
    setSelectedTimeSlot(newSelection);
  };

  // Format address for display
  const formatAddress = (location) => {
    if (!location) return 'Address not available';
    
    const { street, city, state, zip_code } = location;
    const parts = [street, city, state, zip_code].filter(Boolean);
    return parts.join(', ');
  };

  // Handle booking process
  const handleBookingClick = () => {
    // Check if user is logged in
    const user = getUserFromLocalStorage();
    if (!user) {
      // Redirect to login
      navigate('/auth', { state: { message: 'Please login to book an appointment' } });
      return;
    }
    
    setBookingDialogOpen(true);
  };

  // Handle booking confirmation
  const handleBookingConfirm = () => {
    // Navigate to booking page with selected time slot
    navigate(`/booking/${id}`, { 
      state: { 
        selectedTimeSlot: `${selectedDay}_${selectedTimeSlot}` 
      } 
    });
    setBookingDialogOpen(false);
  };

  // Handle back button click
  const handleBackClick = () => {
    // Check if we came from vet details page
    const fromDetails = location.state?.from === 'details';
    
    if (fromDetails) {
      navigate(`/vet-details/${id}`);
    } else {
      navigate('/vet-list');
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setBookingDialogOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading veterinarian schedule...
        </Typography>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/vet-list')}
          >
            Return to Vet List
          </Button>
        </Box>
      </Container>
    );
  }

  // If vet data not found
  if (!vet) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Veterinarian information not found</Alert>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/vet-list')}
          >
            Return to Vet List
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" onClick={handleBackClick} startIcon={<BackIcon />}>
          Back
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Vet Information */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={vet.profile_picture} 
                  sx={{ width: 80, height: 80, mr: 2 }}
                >
                  {vet.name ? vet.name.charAt(0) : 'V'}
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {vet.name || 'Unknown Vet'}
                  </Typography>
                  <Chip 
                    label={vet.specialty || 'General Veterinarian'} 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
              
              <Typography variant="body1" paragraph>
                {vet.bio || 'No biography available'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {vet.contact?.phone_number || 'No phone number provided'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {vet.contact?.email || 'No email provided'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {formatAddress(vet.location)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Schedule */}
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ScheduleIcon fontSize="medium" color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                Availability Schedule
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Select an available time slot (highlighted in green) to book an appointment.
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="day-select-label">Day</InputLabel>
              <Select
                labelId="day-select-label"
                id="day-select"
                value={selectedDay}
                label="Day"
                onChange={handleDayChange}
              >
                {DAYS_OF_WEEK.map((day) => (
                  <MenuItem key={day.value} value={day.value}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time Slot</TableCell>
                    <TableCell>Availability</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TIME_SLOTS.map(time => {
                    const isAvailable = availableTimeSlots.includes(time.value);
                    const isSelected = selectedTimeSlot === time.value;
                    
                    return (
                      <TableRow key={time.value}>
                        <TableCell>
                          <Typography fontWeight="medium">{time.label}</Typography>
                        </TableCell>
                        <TableCell>
                          {isAvailable ? (
                            <Chip 
                              icon={<AvailableIcon />} 
                              label="Available" 
                              color="success" 
                              size="small" 
                            />
                          ) : (
                            <Chip 
                              icon={<UnavailableIcon />} 
                              label="Unavailable" 
                              color="default" 
                              size="small" 
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={isSelected ? "contained" : "outlined"}
                            color="primary"
                            size="small"
                            disabled={!isAvailable}
                            onClick={() => handleTimeSlotSelection(time.value)}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                startIcon={<TodayIcon />}
                disabled={!selectedTimeSlot}
                onClick={handleBookingClick}
              >
                Book Appointment
              </Button>
            </Box>
          </Paper>

          {/* Show booking confirmation when a time slot is selected */}
          {selectedTimeSlot && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Ready to Book Your Appointment
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You've selected: <strong>{selectedDay} - {selectedTimeSlot}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Book Appointment" to continue with your booking
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Booking Confirmation Dialog */}
      <Dialog open={bookingDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Confirm Appointment Time</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You're about to book an appointment with {vet.name} on {selectedDay} during the {selectedTimeSlot.toLowerCase()} time slot.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Would you like to proceed with this booking?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleBookingConfirm} variant="contained" color="primary">
            Proceed to Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VetSchedule; 