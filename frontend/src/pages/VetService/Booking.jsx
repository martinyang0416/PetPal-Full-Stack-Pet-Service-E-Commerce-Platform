import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Box, TextField, 
  MenuItem, Button, Stepper, Step, StepLabel, 
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
  Card, CardContent, Alert, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Grid } from '@mui/material';
import { 
  Pets as PetsIcon, 
  MedicalServices as MedicalIcon,
  EventNote as EventIcon,
  Check as CheckIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const serviceCategories = [
  { value: 'checkup', label: 'General Check-up' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'dental', label: 'Dental Care' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'emergency', label: 'Emergency Care' },
  { value: 'consultation', label: 'Consultation' },
];

const Booking = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [pets, setPets] = useState([]);
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [petAddDialogOpen, setPetAddDialogOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    petId: '',
    serviceCategory: '',
    serviceType: 'in_person', // 'in_person' or 'mobile'
    notes: '',
    timeSlot: location.state?.selectedTimeSlot || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get the current user from localStorage
        const userData = localStorage.getItem('user');
        let user = null;
        
        if (userData) {
          try {
            user = JSON.parse(userData);
          } catch (err) {
            console.error('Error parsing user data:', err);
            setError('Error loading user data. Please log in again.');
            setLoading(false);
            return;
          }
        } else {
          setError('You must be logged in to book an appointment');
          setLoading(false);
          return;
        }
        
        // Fetch vet details
        const vetResponse = await axios.get(`/api/vets/${id}`);
        setVet(vetResponse.data);
        
        // Try both API endpoints to fetch user's pets
        try {
          // First try the profile API endpoint (JWT auth)
          const petsResponse = await axios.get('/api/pets', {
            withCredentials: true
          });
          
          if (petsResponse.data && petsResponse.data.length > 0) {
            console.log('Fetched pets from profile API:', petsResponse.data);
            setPets(petsResponse.data);
          } else {
            // If no pets found with first method, try the second endpoint
            if (user._id) {
              const userPetsResponse = await axios.get(`/api/users/${user._id}/pets`);
              console.log('Fetched pets from users API:', userPetsResponse.data);
              setPets(userPetsResponse.data); 
            }
          }
        } catch (err) {
          console.error('Error fetching pets:', err);
          // Don't set error here, just log it. We'll show a message to add pets
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Format time slot for display
  const formatTimeSlot = (slot) => {
    if (!slot) return 'Not selected';
    const [day, time] = slot.split('_');
    return `${day}, ${time}`;
  };
  
  // Validate if the form is complete for the current step
  const isStepComplete = () => {
    switch (activeStep) {
      case 0: // Pet Selection
        return !!bookingData.petId;
      case 1: // Service Details
        return !!bookingData.serviceCategory && !!bookingData.serviceType;
      case 2: // Review
        return true;
      default:
        return false;
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNext = () => {
    if (activeStep === 2) {
      handleSubmit();
    } else {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      // Get current user data from localStorage
      const userData = localStorage.getItem('user');
      let currentUser = null;
      let token = localStorage.getItem('token');
      
      if (userData) {
        try {
          currentUser = JSON.parse(userData);
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }
      
      // Get selected pet details for debugging
      const selectedPet = pets.find(p => p._id === bookingData.petId);
      console.log('Selected pet for booking:', selectedPet);
      console.log('Pet ID used for booking:', bookingData.petId);
      console.log('Vet ID used for booking:', id);
      console.log('Current user:', currentUser);
      
      // Create the booking data with properly formatted IDs
      const bookingPayload = {
        petId: bookingData.petId,
        vetId: id,
        serviceCategory: bookingData.serviceCategory,
        serviceType: bookingData.serviceType,
        notes: bookingData.notes,
        timeSlot: bookingData.timeSlot,
        // Include owner data to help with owner lookup on the backend
        ownerData: {
          ...currentUser,
          // Explicitly include user info to ensure it's captured properly
          username: currentUser?.user_name || currentUser?.username,
          name: currentUser?.name || currentUser?.user_name || 'Pet Owner',
          email: currentUser?.email || currentUser?.contact?.email,
          phone: currentUser?.phone || currentUser?.contact?.phone_number
        }
      };
      
      console.log('Sending booking payload with owner data:', bookingPayload);
      
      // Create headers with authorization if token exists
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Create the booking via API
      // Try different API endpoints to handle both formats
      try {
        // First try with underscores
        const response = await axios.post('/api/vet_services', bookingPayload, {
          headers: headers,
          withCredentials: true
        });
        console.log('Booking created successfully (underscore endpoint):', response.data);
        setSuccess(true);
        setActiveStep(3);
      } catch (innerErr) {
        console.log('Failed with underscore, trying with dash endpoint');
        // If that fails, try with dashes
        const response = await axios.post('/api/vet-services', bookingPayload, {
          headers: headers,
          withCredentials: true
        });
        console.log('Booking created successfully (dash endpoint):', response.data);
        setSuccess(true);
        setActiveStep(3);
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      
      // Check for specific error messages from the API response
      if (err.response && err.response.data) {
        const errorMessage = err.response.data.error || 'Failed to create booking. Please try again.';
        setError(errorMessage);
        console.error('API error response:', err.response.data);
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleViewBookings = () => {
    navigate('/my-bookings');
  };

  const handleAddPet = () => {
    // Here we'll redirect to a page where the user can add a pet
    navigate('/edit-profile', { state: { addPet: true } });
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading booking information...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Book an Appointment with {vet?.name}
        </Typography>
        
        <Box sx={{ width: '100%', mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            <Step>
              <StepLabel>Select Pet</StepLabel>
            </Step>
            <Step>
              <StepLabel>Service Details</StepLabel>
            </Step>
            <Step>
              <StepLabel>Review & Confirm</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete</StepLabel>
            </Step>
          </Stepper>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PetsIcon sx={{ mr: 1 }} /> Select Your Pet
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose the pet that needs veterinary care.
            </Typography>
            
            {pets.length > 0 ? (
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  name="petId"
                  value={bookingData.petId}
                  onChange={handleChange}
                >
                  <Grid container spacing={2}>
                    {pets.map(pet => (
                      <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }} key={pet._id}>
                        <FormControlLabel
                          value={pet._id}
                          control={<Radio />}
                          label=""
                          sx={{ 
                            width: '100%', 
                            m: 0,
                            '& .MuiFormControlLabel-label': { width: '100%' } 
                          }}
                        />
                        <Card 
                          sx={{ 
                            border: bookingData.petId === pet._id ? '2px solid #4caf50' : 'none',
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 3 },
                            ml: 4
                          }}
                          onClick={() => setBookingData(prev => ({ ...prev, petId: pet._id }))}
                        >
                          <CardContent>
                            <Typography variant="h6">{pet.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {pet.species || pet.pet_type} • {pet.breed} • {pet.age} years old
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              </FormControl>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                You don't have any pets registered. Please add a pet first.
              </Alert>
            )}
            
            {/* Add Pet Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleAddPet}
              >
                Add a New Pet
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <MedicalIcon sx={{ mr: 1 }} /> Service Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  select
                  fullWidth
                  label="Service Category"
                  name="serviceCategory"
                  value={bookingData.serviceCategory}
                  onChange={handleChange}
                  helperText="Select the type of veterinary service needed"
                  required
                >
                  {serviceCategories.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid sx={{ gridColumn: 'span 12' }}>
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <FormLabel component="legend">Service Type</FormLabel>
                  <RadioGroup
                    name="serviceType"
                    value={bookingData.serviceType}
                    onChange={handleChange}
                    row
                  >
                    <FormControlLabel 
                      value="in_person" 
                      control={<Radio />} 
                      label="In-person Visit (at vet's location)" 
                    />
                    <FormControlLabel 
                      value="mobile" 
                      control={<Radio />} 
                      label="Mobile Service (vet visits your location)" 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  name="notes"
                  value={bookingData.notes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  helperText="Describe symptoms, concerns, or any relevant information"
                />
              </Grid>
            </Grid>
          </Box>
        )}
        
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon sx={{ mr: 1 }} /> Review Appointment Details
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Veterinarian
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {vet?.name}
                    </Typography>
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Specialty
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {vet?.specialty || 'General Veterinarian'}
                    </Typography>
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Pet
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {pets.find(p => p._id === bookingData.petId)?.name || 'Not selected'}
                    </Typography>
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Time Slot
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatTimeSlot(bookingData.timeSlot)}
                    </Typography>
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Service Category
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {serviceCategories.find(c => c.value === bookingData.serviceCategory)?.label || 'Not selected'}
                    </Typography>
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Service Type
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {bookingData.serviceType === 'in_person' ? 'In-person Visit' : 'Mobile Service'}
                    </Typography>
                  </Grid>
                  
                  {bookingData.notes && (
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Additional Notes
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {bookingData.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
            
            <Alert severity="info">
              Your request will be sent to the veterinarian for confirmation. You'll receive a notification once they respond.
            </Alert>
          </Box>
        )}
        
        {activeStep === 3 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              bgcolor: 'success.light',
              color: 'success.dark',
              width: 80,
              height: 80,
              borderRadius: '50%',
              mx: 'auto',
              mb: 3
            }}>
              <CheckIcon sx={{ fontSize: 40 }} />
            </Box>
            
            <Typography variant="h5" gutterBottom>
              Booking Successful!
            </Typography>
            
            <Typography variant="body1" paragraph>
              Your appointment request has been sent to {vet?.name}.
              You will receive a notification once they confirm your request.
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleViewBookings}
              sx={{ mt: 2 }}
            >
              View My Bookings
            </Button>
          </Box>
        )}
        
        {activeStep < 3 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!isStepComplete() || submitting || (activeStep === 0 && pets.length === 0)}
            >
              {activeStep === 2 ? 'Confirm Booking' : 'Next'}
              {submitting && (
                <CircularProgress size={24} sx={{ ml: 1 }} />
              )}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Booking; 