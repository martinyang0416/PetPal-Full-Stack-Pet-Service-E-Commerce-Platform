import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Grid, Avatar, Chip, Divider,
  Button, Card, CardContent, CircularProgress, Alert, Skeleton,
  List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Verified as VerifiedIcon,
  Star as StarIcon,
  MedicalServices as MedicalIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vet, setVet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    const fetchVetDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/vets/${id}`);
        setVet(response.data);
        
        // Generate map URL from location data
        if (response.data.location) {
          const { street, city, state, zip_code, country } = response.data.location;
          if (city && state) {
            const locationString = encodeURIComponent([
              street,
              city,
              state,
              zip_code,
              country
            ].filter(Boolean).join(', '));
            
            setMapUrl(`https://maps.google.com/maps?q=${locationString}&t=&z=13&ie=UTF8&iwloc=&output=embed`);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching vet details:', err);
        setError('Failed to load veterinarian details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVetDetails();
    }
  }, [id]);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeSlots = ["Morning", "Afternoon", "Evening"];

  const formatAvailability = (availability) => {
    if (!availability) return [];

    const formattedSlots = [];
    
    daysOfWeek.forEach(day => {
      let availableTimesForDay = [];
      
      timeSlots.forEach(slot => {
        if (availability[`${day}_${slot}`]) {
          availableTimesForDay.push(slot);
        }
      });
      
      if (availableTimesForDay.length > 0) {
        formattedSlots.push({
          day,
          times: availableTimesForDay
        });
      }
    });
    
    return formattedSlots;
  };

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  const handleScheduleClick = () => {
    if (id) {
      navigate(`/vet-schedule/${id}`, { state: { from: 'details' } });
    } else {
      setError('Could not determine veterinarian ID. Please go back and try again.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
          <Button 
            startIcon={<BackIcon />} 
            onClick={handleBackClick} 
            sx={{ position: 'absolute', top: 16, left: 16 }}
          >
            Back
          </Button>
          
          <Box sx={{ display: 'flex', mb: 4, mt: 4, alignItems: 'center' }}>
            <Skeleton variant="circular" width={100} height={100} sx={{ mr: 3 }} />
            <Box>
              <Skeleton variant="text" width={200} height={40} />
              <Skeleton variant="text" width={150} height={30} />
            </Box>
          </Box>
          
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={handleBackClick}>
          Back to Vet List
        </Button>
      </Container>
    );
  }

  if (!vet) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Veterinarian not found.</Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Back to Vet List
        </Button>
      </Container>
    );
  }

  const availableSlots = formatAvailability(vet.availability);
  const hasLocation = vet.location?.city && vet.location?.state;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
        <Button 
          startIcon={<BackIcon />} 
          onClick={handleBackClick} 
          sx={{ position: 'absolute', top: 16, left: 16 }}
        >
          Back
        </Button>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, mt: 6, mb: 4, alignItems: { xs: 'center', md: 'flex-start' } }}>
          <Avatar 
            src={vet.profile_picture} 
            sx={{ 
              width: 120, 
              height: 120, 
              mb: { xs: 2, md: 0 },
              mr: { md: 4 },
              bgcolor: 'primary.main',
              fontSize: '3rem'
            }}
          >
            {vet.name ? vet.name.charAt(0) : 'V'}
          </Avatar>
          
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ mr: 1 }}>
                {vet.name || 'Unknown Name'}
              </Typography>
              <VerifiedIcon color="primary" sx={{ ml: 1 }} />
            </Box>
            
            <Chip 
              icon={<MedicalIcon />} 
              label={vet.specialty || 'General Veterinarian'} 
              color="primary" 
              variant="outlined" 
              sx={{ mb: 1 }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <LocationIcon color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body1" sx={{ mr: 2 }}>
                {hasLocation
                  ? `${vet.location.city}, ${vet.location.state}`
                  : 'Location not specified'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleScheduleClick}
            sx={{ 
              mt: { xs: 2, md: 0 }, 
              minWidth: 200,
              height: 48
            }}
          >
            View Schedule & Book
          </Button>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <MedicalIcon sx={{ mr: 1 }} />
              About
            </Typography>
            
            <Typography variant="body1" paragraph>
              {vet.bio || 'No biography information available for this veterinarian.'}
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Contact Information
              </Typography>
              
              <List dense>
                {vet.contact?.phone_number && (
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Phone"
                      secondary={vet.contact.phone_number}
                    />
                  </ListItem>
                )}
                
                {vet.contact?.email && (
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email"
                      secondary={vet.contact.email}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Location
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <LocationIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      {vet.location?.street || ''}
                    </Typography>
                    <Typography variant="body1">
                      {[
                        vet.location?.city, 
                        vet.location?.state, 
                        vet.location?.zip_code
                      ].filter(Boolean).join(', ')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {vet.location?.country || ''}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Map section */}
                {mapUrl && (
                  <Box sx={{ mt: 2, height: 250, width: '100%', overflow: 'hidden', borderRadius: 1 }}>
                    <iframe
                      title="Vet Location Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      src={mapUrl}
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                    ></iframe>
                  </Box>
                )}
                
                {!mapUrl && hasLocation && (
                  <Button 
                    variant="outlined" 
                    startIcon={<LocationIcon />}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [vet.location.street, vet.location.city, vet.location.state, vet.location.zip_code, vet.location.country]
                        .filter(Boolean)
                        .join(', ')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mt: 2 }}
                  >
                    Open in Google Maps
                  </Button>
                )}
                
                {!hasLocation && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No location information available.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 1 }} />
              Availability
            </Typography>
            
            {availableSlots.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No specific availability information provided. Please contact the veterinarian directly for appointment times.
              </Alert>
            ) : (
              <Card variant="outlined">
                <CardContent>
                  <List dense>
                    {availableSlots.map((slot) => (
                      <ListItem key={slot.day}>
                        <ListItemIcon>
                          <TimeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={slot.day}
                          secondary={slot.times.join(', ')}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
            
            <Box sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                size="large"
                onClick={handleScheduleClick}
              >
                View Schedule & Book Appointment
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default VetDetails; 