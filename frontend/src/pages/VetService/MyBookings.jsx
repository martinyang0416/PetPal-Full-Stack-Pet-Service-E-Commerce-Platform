import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Tabs, Tab, Chip,
  Card, CardContent, Grid, Button, Divider, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, AlertTitle,
  IconButton, Avatar
} from '@mui/material';
import {
  AccessTime as PendingIcon,
  Check as CompletedIcon,
  PlayArrow as OngoingIcon,
  Cancel as CancelledIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  MedicalServices as ServiceIcon,
  Pets as PetIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Status chip configuration
const statusConfig = {
  pending: { color: 'warning', icon: <PendingIcon fontSize="small" />, label: 'Pending' },
  confirmed: { color: 'info', icon: <OngoingIcon fontSize="small" />, label: 'Confirmed' },
  in_progress: { color: 'primary', icon: <TimelineIcon fontSize="small" />, label: 'In Progress' },
  completed: { color: 'success', icon: <CompletedIcon fontSize="small" />, label: 'Completed' },
  cancelled: { color: 'error', icon: <CancelledIcon fontSize="small" />, label: 'Cancelled' }
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  
  // Filter configurations
  const tabFilters = [
    { label: 'All', filter: () => true },
    { label: 'Pending', filter: booking => booking.status === 'pending' },
    { label: 'Confirmed', filter: booking => booking.status === 'confirmed' },
    { label: 'In Progress', filter: booking => booking.status === 'in_progress' },
    { label: 'Completed', filter: booking => booking.status === 'completed' },
    { label: 'Cancelled', filter: booking => booking.status === 'cancelled' },
  ];

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        // Get user ID from localStorage
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        let userId = null;
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            userId = userData?._id;
            console.log('User ID from localStorage:', userId);
          } catch (error) {
            console.error("Error parsing user data from localStorage:", error);
          }
        }
        
        if (!userId) {
          console.log('User ID not found in localStorage, will try to get user from /api/me');
          try {
            // Try to get the current user from the API
            const userResponse = await axios.get('/api/me', {
              withCredentials: true,
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            userId = userResponse.data._id;
            console.log('Got user ID from API:', userId);
          } catch (userErr) {
            console.error('Error fetching current user:', userErr);
            setError('User ID not found. Please log in again.');
            setLoading(false);
            return;
          }
        }
        
        if (!userId) {
          setError('User ID not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        console.log('Fetching bookings for user ID:', userId);
        
        // Prepare headers with authentication
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Fetch bookings from API - try both endpoint formats and query parameters
        let bookingsData = [];
        let fetchSuccess = false;
        
        // Try first endpoint with userId parameter
        try {
          console.log(`Trying /api/vet-services?userId=${userId}`);
          const response = await axios.get(`/api/vet-services?userId=${userId}`, {
            headers,
            withCredentials: true
          });
          console.log('Bookings response:', response.data);
          bookingsData = response.data;
          fetchSuccess = true;
        } catch (err1) {
          console.error('First attempt failed:', err1);
          
          // Try with ownerId parameter
          try {
            console.log(`Trying /api/vet-services?ownerId=${userId}`);
            const response = await axios.get(`/api/vet-services?ownerId=${userId}`, {
              headers,
              withCredentials: true
            });
            console.log('Bookings response (ownerId):', response.data);
            bookingsData = response.data;
            fetchSuccess = true;
          } catch (err2) {
            console.error('Second attempt failed:', err2);
            
            // Try underscore format
            try {
              console.log(`Trying /api/vet_services?userId=${userId}`);
              const response = await axios.get(`/api/vet_services?userId=${userId}`, {
                headers,
                withCredentials: true
              });
              console.log('Bookings response (underscore):', response.data);
              bookingsData = response.data;
              fetchSuccess = true;
            } catch (err3) {
              console.error('Third attempt failed:', err3);
              
              // Try one more time with all services
              try {
                console.log('Trying to fetch all vet services');
                const response = await axios.get('/api/vet-services', {
                  headers,
                  withCredentials: true
                });
                console.log('All services:', response.data);
                
                // Filter manually by owner ID
                bookingsData = response.data.filter(booking => 
                  booking.ownerId === userId || 
                  String(booking.ownerId) === String(userId)
                );
                console.log('Filtered services by owner ID:', bookingsData);
                fetchSuccess = true;
              } catch (err4) {
                console.error('All attempts failed:', err4);
                throw new Error('Failed to fetch bookings after multiple attempts');
              }
            }
          }
        }
        
        if (fetchSuccess) {
          console.log(`Successfully fetched ${bookingsData.length} bookings`);
          
          // Process bookings to ensure proper data format
          const processedBookings = bookingsData.map(booking => {
            // Extract the actual ID from the _id object if needed
            let id = booking._id;
            if (typeof id === 'object' && id !== null && '$oid' in id) {
              id = id.$oid;
            }
            
            // Format dates if they are objects
            let createdAt = booking.createdAt;
            if (typeof createdAt === 'object' && createdAt !== null && '$date' in createdAt) {
              createdAt = new Date(createdAt.$date);
            }
            
            let updatedAt = booking.updatedAt;
            if (typeof updatedAt === 'object' && updatedAt !== null && '$date' in updatedAt) {
              updatedAt = new Date(updatedAt.$date);
            }
            
            // Make sure image URLs are correct
            let images = booking.images || [];
            images = images.map(img => {
              if (typeof img === 'object') {
                // Ensure URL has proper format
                let imgUrl = img.url;
                if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('/api/images/')) {
                  imgUrl = `/api/images/${img.imageId}`;
                }
                
                return {
                  ...img,
                  url: imgUrl
                };
              }
              return img;
            });
            
            // Process owner info
            const ownerName = booking.ownerName || 'Unknown Owner';
            const ownerContact = booking.ownerContact || {};
            
            return {
              ...booking,
              _id: String(id),
              createdAt,
              updatedAt,
              ownerName,
              ownerContact,
              images
            };
          });
          
          console.log('Processed bookings:', processedBookings);
          setBookings(processedBookings);
        } else {
          setError('Failed to load your bookings. Please try again later.');
          setBookings([]);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your bookings. Please try again later.');
        // Keep the booking state empty if there's an error
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseDetails = () => {
    setSelectedBooking(null);
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      // API call to cancel booking
      await axios.put(`/api/vet-services/${bookingId}`, { 
        status: 'cancelled',
        cancellationReason: 'Cancelled by pet owner'
      });
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === bookingId 
            ? { ...booking, status: 'cancelled', cancellationReason: 'Cancelled by pet owner' } 
            : booking
        )
      );
      
      // Close detail dialog if open
      if (selectedBooking && selectedBooking._id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: 'cancelled', cancellationReason: 'Cancelled by pet owner' });
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const handleOpenFeedback = (booking) => {
    setSelectedBooking(booking);
    setFeedbackDialogOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedBooking) return;
    
    try {
      // API call to submit feedback
      await axios.post(`/api/vet-services/${selectedBooking._id}/feedback`, {
        rating: feedbackRating,
        comment: feedback
      });
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === selectedBooking._id 
            ? { 
                ...booking, 
                feedback: { 
                  rating: feedbackRating, 
                  comment: feedback,
                  timestamp: new Date().toISOString()
                } 
              } 
            : booking
        )
      );
      
      // Close dialog
      setFeedbackDialogOpen(false);
      setFeedback('');
      setFeedbackRating(5);
      
      // Inform user
      alert('Thank you for your feedback!');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  // Format date and time
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time slot
  const formatTimeSlot = (slot) => {
    if (!slot) return '';
    const [day, time] = slot.split('_');
    return `${day}, ${time}`;
  };

  // Get service category label
  const getServiceLabel = (category) => {
    const categories = {
      checkup: 'General Check-up',
      vaccination: 'Vaccination',
      surgery: 'Surgery',
      dental: 'Dental Care',
      grooming: 'Grooming',
      emergency: 'Emergency Care',
      consultation: 'Consultation',
    };
    return categories[category] || category;
  };

  // Filtered bookings based on tab selection
  const filteredBookings = bookings.filter(tabFilters[tabValue].filter);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your bookings...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Vet Appointments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage all your veterinary service appointments.
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabFilters.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {filteredBookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No {tabValue === 0 ? '' : tabFilters[tabValue].label.toLowerCase()} appointments found
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/vet-list')}
            sx={{ mt: 2 }}
          >
            Book a New Appointment
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredBookings.map(booking => (
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }} key={booking._id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      {getServiceLabel(booking.serviceCategory)}
                    </Typography>
                    <Chip 
                      icon={statusConfig[booking.status]?.icon}
                      label={statusConfig[booking.status]?.label}
                      color={statusConfig[booking.status]?.color}
                      size="small"
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid sx={{ gridColumn: { xs: 'span 6' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PetIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Pet:
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {booking.petName || 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid sx={{ gridColumn: { xs: 'span 6' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ServiceIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Veterinarian:
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {booking.vetName || 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid sx={{ gridColumn: { xs: 'span 6' } }}>
                      <Typography variant="body2" color="text.secondary">
                        Date Created:
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {formatDate(booking.createdAt)}
                      </Typography>
                    </Grid>
                    
                    <Grid sx={{ gridColumn: { xs: 'span 6' } }}>
                      <Typography variant="body2" color="text.secondary">
                        Appointment:
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {formatTimeSlot(booking.timeSlot)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      startIcon={<InfoIcon />}
                      onClick={() => handleViewDetails(booking)}
                    >
                      View Details
                    </Button>
                    
                    {booking.status === 'pending' && (
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={() => handleCancelBooking(booking._id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                    
                    {booking.status === 'completed' && !booking.feedback && (
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        size="small"
                        onClick={() => handleOpenFeedback(booking)}
                      >
                        Leave Feedback
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog 
          open={!!selectedBooking && !feedbackDialogOpen} 
          onClose={handleCloseDetails}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Appointment Details
            <IconButton
              aria-label="close"
              onClick={handleCloseDetails}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {getServiceLabel(selectedBooking.serviceCategory)}
                  </Typography>
                  <Chip 
                    icon={statusConfig[selectedBooking.status]?.icon}
                    label={statusConfig[selectedBooking.status]?.label}
                    color={statusConfig[selectedBooking.status]?.color}
                  />
                </Box>
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Appointment Information
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid sx={{ gridColumn: { xs: 'span 6' } }}>
                        <Typography variant="body2" color="text.secondary">
                          Service Type:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {selectedBooking.serviceType === 'in_person' ? 'In-person Visit' : 'Mobile Service'}
                        </Typography>
                      </Grid>
                      
                      <Grid sx={{ gridColumn: { xs: 'span 6' } }}>
                        <Typography variant="body2" color="text.secondary">
                          Scheduled Time:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatTimeSlot(selectedBooking.timeSlot)}
                        </Typography>
                      </Grid>
                      
                      <Grid sx={{ gridColumn: { xs: 'span 6' } }}>
                        <Typography variant="body2" color="text.secondary">
                          Date Created:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDate(selectedBooking.createdAt)}
                        </Typography>
                      </Grid>
                      
                      <Grid sx={{ gridColumn: { xs: 'span 6' } }}>
                        <Typography variant="body2" color="text.secondary">
                          Last Updated:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDate(selectedBooking.updatedAt)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Service Provider
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>
                        {selectedBooking.vetName ? selectedBooking.vetName.charAt(0) : 'V'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {selectedBooking.vetName || 'Unknown Vet'}
                        </Typography>
                        <Button 
                          variant="text" 
                          size="small"
                          onClick={() => {
                            handleCloseDetails();
                            navigate(`/vet-schedule/${selectedBooking.vetId}`);
                          }}
                        >
                          View Profile
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid sx={{ gridColumn: 'span 12' }}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pet Information
                    </Typography>
                    
                    <Typography variant="body1">
                      <strong>Name:</strong> {selectedBooking.petName || 'N/A'}
                    </Typography>
                    {selectedBooking.petSpecies && (
                      <Typography variant="body1">
                        <strong>Species:</strong> {selectedBooking.petSpecies}
                        {selectedBooking.petBreed && ` (${selectedBooking.petBreed})`}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {selectedBooking.notes && (
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Your Notes
                      </Typography>
                      <Typography variant="body1">
                        {selectedBooking.notes}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {(selectedBooking.vetNotes || selectedBooking.medicalNotes) && (
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Veterinarian's Notes
                      </Typography>
                      <Typography variant="body1">
                        {selectedBooking.medicalNotes || selectedBooking.vetNotes}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {selectedBooking.tracking && selectedBooking.tracking.length > 0 && (
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimelineIcon sx={{ mr: 1 }} /> Service Progress
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        {selectedBooking.tracking.map((step, index) => (
                          <Box 
                            key={step.step} 
                            sx={{ 
                              display: 'flex', 
                              mb: 2,
                              opacity: step.completed ? 1 : 0.5
                            }}
                          >
                            <Box 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                bgcolor: step.completed ? 'success.main' : 'grey.300',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white',
                                mr: 2
                              }}
                            >
                              {step.completed ? <CheckIcon fontSize="small" /> : index + 1}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                                {step.step.replace('-', ' ')}
                              </Typography>
                              {step.completed && step.timestamp && (
                                <Typography variant="body2" color="text.secondary">
                                  Completed on {formatDate(step.timestamp)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {selectedBooking.status === 'cancelled' && selectedBooking.cancellationReason && (
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Alert severity="error">
                    <AlertTitle>Cancellation Reason</AlertTitle>
                    {selectedBooking.cancellationReason}
                  </Alert>
                </Grid>
              )}
              
              {selectedBooking && selectedBooking.images && selectedBooking.images.length > 0 && (
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Medical Images
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedBooking.images.map((image, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Box
                              component="img"
                              src={image.url.startsWith('http') ? image.url : `${axios.defaults.baseURL}${image.url}`}
                              alt={image.caption || `Medical image ${index + 1}`}
                              sx={{
                                width: '100%',
                                height: 150,
                                objectFit: 'cover',
                                borderRadius: 1,
                                cursor: 'pointer'
                              }}
                              onClick={() => window.open(image.url.startsWith('http') ? image.url : `${axios.defaults.baseURL}${image.url}`, '_blank')}
                            />
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              {image.caption || `Image ${index + 1}`}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseDetails}>Close</Button>
            
            {selectedBooking.status === 'pending' && (
              <Button 
                variant="outlined" 
                color="error" 
                onClick={() => {
                  handleCancelBooking(selectedBooking._id);
                }}
              >
                Cancel Appointment
              </Button>
            )}
            
            {selectedBooking.status === 'completed' && !selectedBooking.feedback && (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleOpenFeedback(selectedBooking)}
              >
                Leave Feedback
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
      
      {/* Feedback Dialog */}
      <Dialog 
        open={feedbackDialogOpen} 
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Your Feedback</DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" paragraph>
            Your feedback helps us improve our services. Please rate your experience with {selectedBooking?.vetName}.
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Rating:
            </Typography>
            <Box sx={{ display: 'flex' }}>
              {[1, 2, 3, 4, 5].map(rating => (
                <IconButton 
                  key={rating}
                  onClick={() => setFeedbackRating(rating)}
                  color={rating <= feedbackRating ? 'primary' : 'default'}
                >
                  <StarIcon />
                </IconButton>
              ))}
            </Box>
          </Box>
          
          <TextField
            fullWidth
            label="Comments"
            multiline
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Please share your experience with this veterinary service..."
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmitFeedback}
            disabled={!feedback.trim()}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyBookings; 