import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  InputAdornment,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon,
  CalendarMonth as CalendarIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const specialties = [
  'General Veterinarian',
  'Small Animal Specialist',
  'Large Animal Specialist',
  'Exotic Animal Specialist',
  'Emergency Veterinarian',
  'Feline Specialist',
  'Canine Specialist',
  'Avian Specialist',
  'Dental Specialist',
  'Dermatology Specialist',
  'Surgery Specialist'
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = ["Morning", "Afternoon", "Evening"];

const VetProfileForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'General Veterinarian',
    bio: '',
    phone_number: '',
    email: '',
    location: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: ''
    },
    availability: {}
  });

  // Initialize availability slots
  useEffect(() => {
    const initialAvailability = {};
    daysOfWeek.forEach(day => {
      timeSlots.forEach(slot => {
        initialAvailability[`${day}_${slot}`] = false;
      });
    });
    setFormData(prev => ({
      ...prev,
      availability: initialAvailability
    }));
  }, []);

  // Load current user data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Pre-fill form with existing data if available
        const updatedFormData = { ...formData };
        
        if (userData.name) {
          updatedFormData.name = userData.name;
        }

        if (userData.contact?.email || userData.email) {
          updatedFormData.email = userData.contact?.email || userData.email || '';
        }

        if (userData.contact?.phone_number || userData.phone_number) {
          updatedFormData.phone_number = userData.contact?.phone_number || userData.phone_number || '';
        }

        if (userData.location) {
          updatedFormData.location = {
            street: userData.location.street || '',
            city: userData.location.city || '',
            state: userData.location.state || '',
            zip_code: userData.location.zip_code || '',
            country: userData.location.country || ''
          };
        }

        if (userData.bio) {
          updatedFormData.bio = userData.bio;
        }

        if (userData.specialty) {
          updatedFormData.specialty = userData.specialty;
        }

        if (userData.availability) {
          updatedFormData.availability = { ...updatedFormData.availability, ...userData.availability };
        }
        
        setFormData(updatedFormData);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
  };

  const handleAvailabilityChange = (day, slot) => {
    const key = `${day}_${slot}`;
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [key]: !prev.availability[key]
      }
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get address from coordinates
          // Create a separate axios instance without credentials for Nominatim
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
          
          // Use fetch instead of axios to avoid the User-Agent header issue
          const response = await fetch(nominatimUrl, {
            method: 'GET',
            credentials: 'omit', // Don't send cookies
            headers: {
              'Accept-Language': 'en-US,en'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          const address = data.address;
          
          setFormData(prev => ({
            ...prev,
            location: {
              street: address.road || '',
              city: address.city || address.town || address.village || '',
              state: address.state || '',
              zip_code: address.postcode || '',
              country: address.country || ''
            }
          }));
        } catch (err) {
          console.error('Error getting location details:', err);
          setError('Failed to get location details. Please enter manually.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        console.error('Error getting location:', error);
        setError(`Error getting location: ${error.message}`);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data for API
      const updateData = {
        name: formData.name,
        specialty: formData.specialty,
        bio: formData.bio,
        phone_number: formData.phone_number,
        location: formData.location,
        availability: formData.availability,
        is_public: true,  // Vets should be public by default
        identity: ['vet'] // Ensure vet identity is set
      };

      // Create FormData object
      const apiFormData = new FormData();
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Add token to update data for authentication
      if (token) {
        updateData.token = token;
      }
      
      apiFormData.append('data', JSON.stringify(updateData));

      // Determine the API path based on the environment
      const apiPath = '/api/complete_profile';
        
      // Send to API
      await axios.post(apiPath, apiFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      // Update local storage
      if (user) {
        const updatedUser = {
          ...user,
          name: formData.name,
          specialty: formData.specialty,
          bio: formData.bio,
          contact: {
            ...user.contact,
            phone_number: formData.phone_number,
            email: formData.email
          },
          location: formData.location,
          availability: formData.availability
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setSuccess(true);
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/vet-dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error updating vet profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <MedicalIcon sx={{ mr: 1 }} color="primary" />
          Complete Your Vet Profile
        </Typography>
        
        <Typography variant="body1" paragraph color="text.secondary">
          Please complete your veterinarian profile information. This will help pet owners find you and understand your services.
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <TextField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="Dr. John Smith"
                />
              
                <TextField
                  label="Specialty"
                  name="specialty"
                  select
                  value={formData.specialty}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                >
                  {specialties.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Professional Bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Tell pet owners about your experience, specialties, and approach to veterinary care..."
                  helperText="This will be displayed on your public profile"
                />
              </Box>
            </Box>
            
            <Divider />
            
            {/* Contact Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <TextField
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="(555) 123-4567"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              
                <TextField
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  type="email"
                  variant="outlined"
                  placeholder="drsmith@example.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
            
            <Divider />
            
            {/* Location Information */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Location Information
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  startIcon={locationLoading ? <CircularProgress size={20} /> : <MyLocationIcon />}
                >
                  {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                </Button>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Street Address"
                  name="street"
                  value={formData.location.street}
                  onChange={handleLocationChange}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="123 Main St."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              <Box sx={{ 
                mt: 2,
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: '1fr 1fr', 
                  md: '4fr 3fr 2fr 3fr' 
                },
                gap: 2
              }}>
                <TextField
                  label="City"
                  name="city"
                  value={formData.location.city}
                  onChange={handleLocationChange}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="New York"
                />
              
                <TextField
                  label="State"
                  name="state"
                  value={formData.location.state}
                  onChange={handleLocationChange}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="NY"
                />
              
                <TextField
                  label="ZIP Code"
                  name="zip_code"
                  value={formData.location.zip_code}
                  onChange={handleLocationChange}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="10001"
                />
              
                <TextField
                  label="Country"
                  name="country"
                  value={formData.location.country}
                  onChange={handleLocationChange}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="USA"
                />
              </Box>
            </Box>
            
            <Divider />
            
            {/* Availability */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1 }} />
                Availability
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select the time slots when you are usually available for appointments.
              </Typography>
              
              <Box sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                p: 2
              }}>
                {/* First create a header row with empty first cell and time slots */}
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: '120px repeat(3, 1fr)',
                  gap: 1,
                  mb: 2
                }}>
                  {/* Empty cell in top-left corner */}
                  <Box></Box>
                  
                  {/* Time slot headers */}
                  {timeSlots.map((slot) => (
                    <Typography key={slot} variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
                      {slot}
                    </Typography>
                  ))}
                </Box>
                
                {/* Create a row for each day of the week */}
                {daysOfWeek.map((day) => (
                  <Box 
                    key={day}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '120px repeat(3, 1fr)',
                      gap: 1,
                      mb: 1.5,
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {day}
                    </Typography>
                    
                    {timeSlots.map((slot) => (
                      <Box key={`${day}-${slot}`} sx={{ textAlign: 'center' }}>
                        <Checkbox
                          checked={!!formData.availability[`${day}_${slot}`]}
                          onChange={() => handleAvailabilityChange(day, slot)}
                          color="primary"
                        />
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'Saving Profile...' : 'Save Profile & Continue'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success">
          Profile updated successfully! Redirecting to dashboard...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VetProfileForm; 