import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Tabs, Tab, Paper,
  Card, CardContent, CardActions, Button, Chip, Divider,
  Avatar, IconButton, LinearProgress, Alert
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  AccessTime as PendingIcon,
  Check as CompletedIcon,
  PlayArrow as OngoingIcon,
  Timeline as TimelineIcon,
  ViewList as ListIcon,
  NotificationsActive as NotificationsIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Status chip configuration
const statusConfig = {
  pending: { color: 'warning', icon: <PendingIcon fontSize="small" />, label: 'Pending' },
  confirmed: { color: 'info', icon: <OngoingIcon fontSize="small" />, label: 'Confirmed' },
  in_progress: { color: 'primary', icon: <TimelineIcon fontSize="small" />, label: 'In Progress' },
  completed: { color: 'success', icon: <CompletedIcon fontSize="small" />, label: 'Completed' }
};

const VetDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Tab filters
  const tabs = [
    { label: 'New Requests', status: 'pending', icon: <PendingIcon /> },
    { label: 'Ongoing Tasks', status: ['confirmed', 'in_progress'], icon: <OngoingIcon /> },
    { label: 'Completed Tasks', status: 'completed', icon: <CompletedIcon /> }
  ];

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        // Get vet ID from localStorage
        const storedUser = localStorage.getItem('user');
        let userId = null;
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            userId = userData?._id;
            console.log('Vet ID from localStorage:', userId);
          } catch (error) {
            console.error("Error parsing user data from localStorage:", error);
          }
        }
        
        if (!userId) {
          setError('User ID not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        // Fetch service requests from API
        console.log(`Fetching service requests for vet ID: ${userId}`);
        const response = await axios.get(`/api/vet-services?vetId=${userId}`);
        
        // Add debugging for response data
        console.log(`Received ${response.data.length} service requests`);
        if (response.data.length > 0) {
          console.log('First request sample:', response.data[0]);
          console.log('ID type:', typeof response.data[0]._id);
        }
        
        // Process the requests to ensure proper data types
        const processedRequests = response.data.map(req => {
          // Extract the actual ID from the _id object if needed
          let id = req._id;
          if (typeof id === 'object' && id !== null && '$oid' in id) {
            id = id.$oid;
          }
          
          // Format dates if they are objects
          let createdAt = req.createdAt;
          if (typeof createdAt === 'object' && createdAt !== null && '$date' in createdAt) {
            createdAt = new Date(createdAt.$date);
          }
          
          let updatedAt = req.updatedAt;
          if (typeof updatedAt === 'object' && updatedAt !== null && '$date' in updatedAt) {
            updatedAt = new Date(updatedAt.$date);
          }
          
          return {
            ...req,
            _id: String(id),
            createdAt: createdAt,
            updatedAt: updatedAt,
            // Ensure owner name is properly set
            ownerName: req.ownerName || 'Unknown Owner'
          };
        });
        
        console.log('Processed requests:', processedRequests);
        setRequests(processedRequests);
      } catch (err) {
        console.error('Error fetching service requests:', err);
        setError('Failed to load your service requests. Please try again later.');
        // Keep the requests state empty if there's an error
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      console.log('Accepting request ID:', requestId);
      
      // Extract the ID properly if it's an object
      let idToUse = requestId;
      if (typeof requestId === 'object' && requestId !== null) {
        if ('$oid' in requestId) {
          idToUse = requestId.$oid;
        } else if (requestId.toString) {
          idToUse = requestId.toString();
        }
      }
      
      console.log('Using ID for API call:', idToUse);
      
      if (!idToUse || typeof idToUse !== 'string') {
        console.error('Invalid request ID:', requestId);
        alert('Invalid request ID. Please try again.');
        return;
      }
      
      // API call to accept request
      const response = await axios.put(`/api/vet-services/${idToUse}`, {
        status: 'confirmed'
      });
      
      console.log('Update response:', response.data);
      
      // Update local state, but preserve the original request data to ensure owner info is maintained
      setRequests(prevRequests => 
        prevRequests.map(request => {
          if (request._id === idToUse) {
            const updatedRequest = { 
              ...request,
              ...response.data,
              _id: idToUse,
              // Explicitly preserve these fields
              ownerName: request.ownerName,
              ownerContact: request.ownerContact,
              status: 'confirmed'
            };
            console.log('Updated request in local state:', updatedRequest);
            return updatedRequest;
          }
          return request;
        })
      );
      
      alert('Request accepted successfully!');
    } catch (err) {
      console.error('Error accepting request:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      console.log('Rejecting request ID:', requestId);
      
      // Extract the ID properly if it's an object
      let idToUse = requestId;
      if (typeof requestId === 'object' && requestId !== null) {
        if ('$oid' in requestId) {
          idToUse = requestId.$oid;
        } else if (requestId.toString) {
          idToUse = requestId.toString();
        }
      }
      
      console.log('Using ID for API call:', idToUse);
      
      if (!idToUse || typeof idToUse !== 'string') {
        console.error('Invalid request ID:', requestId);
        alert('Invalid request ID. Please try again.');
        return;
      }
      
      // API call to reject request
      const response = await axios.put(`/api/vet-services/${idToUse}`, {
        status: 'cancelled',
        cancellationReason: 'Request declined by veterinarian'
      });
      
      // Update local state by removing the request from view but preserving data integrity
      setRequests(prevRequests => 
        prevRequests.map(request => {
          if (request._id === idToUse) {
            return { 
              ...request,
              ...response.data,
              _id: idToUse,
              // Explicitly preserve these fields
              ownerName: request.ownerName,
              ownerContact: request.ownerContact,
              status: 'cancelled', 
              cancellationReason: 'Request declined by veterinarian' 
            };
          }
          return request;
        })
      );
      
      alert('Request declined successfully.');
    } catch (err) {
      console.error('Error rejecting request:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      alert('Failed to reject request. Please try again.');
    }
  };

  const handleStartService = (requestId) => {
    // Extract the ID properly if it's an object
    let idToUse = requestId;
    if (typeof requestId === 'object' && requestId !== null) {
      if ('$oid' in requestId) {
        idToUse = requestId.$oid;
      } else if (requestId.toString) {
        idToUse = requestId.toString();
      }
    }
    
    navigate(`/vet-service/${idToUse}`);
  };

  // Format time slot for display
  const formatTimeSlot = (slot) => {
    if (!slot) return '';
    const [day, time] = slot.split('_');
    return `${day}, ${time}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    
    try {
      // Check if it's already a Date object
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
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

  // Filter requests based on current tab
  const filteredRequests = requests.filter(request => {
    const tabStatus = tabs[tabValue].status;
    if (Array.isArray(tabStatus)) {
      return tabStatus.includes(request.status);
    }
    return request.status === tabStatus;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          Loading your dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Vet Service Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage service requests and appointments.
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index} 
              label={tab.label} 
              icon={tab.icon} 
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {filteredRequests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No {tabs[tabValue].label.toLowerCase()} found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {tabValue === 0 
              ? "You don't have any new service requests at the moment." 
              : tabValue === 1 
                ? "You don't have any ongoing tasks." 
                : "You don't have any completed tasks yet."}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map(request => (
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }} key={request._id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      {getServiceLabel(request.serviceCategory)}
                    </Typography>
                    <Chip 
                      icon={statusConfig[request.status]?.icon}
                      label={statusConfig[request.status]?.label}
                      color={statusConfig[request.status]?.color}
                      size="small"
                    />
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                          P
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          Pet:
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {request.petName || 'Unknown'} 
                        {request.petSpecies && ` (${request.petSpecies}${request.petBreed ? `, ${request.petBreed}` : ''})`}
                      </Typography>
                    </Grid>
                    
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                          O
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          Owner:
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {request.ownerName || 'Unknown Owner'}
                      </Typography>
                    </Grid>
                    
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <Typography variant="body2" color="text.secondary">
                        Service Type:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {request.serviceType === 'in_person' ? 'In-person Visit' : 'Mobile Service'}
                      </Typography>
                    </Grid>
                    
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <Typography variant="body2" color="text.secondary">
                        Requested Time:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatTimeSlot(request.timeSlot)}
                      </Typography>
                    </Grid>
                    
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <Typography variant="body2" color="text.secondary">
                        Request Date:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatDate(request.createdAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {request.notes && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Client Notes:
                      </Typography>
                      <Typography variant="body2" paragraph>
                        "{request.notes}"
                      </Typography>
                    </>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  {request.status === 'pending' && (
                    <>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={() => {
                          console.log('Declining request:', request._id, typeof request._id);
                          handleRejectRequest(request._id);
                        }}
                      >
                        Decline
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        size="small"
                        onClick={() => {
                          console.log('Accepting request:', request._id, typeof request._id);
                          handleAcceptRequest(request._id);
                        }}
                      >
                        Accept
                      </Button>
                    </>
                  )}
                  
                  {(request.status === 'confirmed' || request.status === 'in_progress') && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small"
                      startIcon={<TimelineIcon />}
                      onClick={() => {
                        console.log('Starting service for:', request._id);
                        handleStartService(request._id);
                      }}
                      fullWidth
                    >
                      {request.status === 'confirmed' ? 'Start Service' : 'Continue Service'}
                    </Button>
                  )}
                  
                  {request.status === 'completed' && (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                      startIcon={<InfoIcon />}
                      onClick={() => {
                        console.log('Viewing details for:', request._id);
                        handleStartService(request._id);
                      }}
                      fullWidth
                    >
                      View Details
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default VetDashboard; 