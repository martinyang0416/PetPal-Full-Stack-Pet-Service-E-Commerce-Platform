import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Container, Alert, CircularProgress } from '@mui/material';
import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get the current user ID from localStorage or session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const currentUser = JSON.parse(storedUser);
        if (currentUser && currentUser._id) {
          setUserId(currentUser._id);
        }

        // Check if user already has a role
        if (currentUser && currentUser.identity) {
          // If user already has a role, redirect to the appropriate page
          if (Array.isArray(currentUser.identity)) {
            if (currentUser.identity.includes('vet')) {
              navigate('/vet-dashboard');
            } else if (currentUser.identity.includes('pet_owner')) {
              navigate('/vet-list');
            }
          } else if (currentUser.identity === 'vet') {
            navigate('/vet-dashboard');
          } else if (currentUser.identity === 'pet_owner') {
            navigate('/vet-list');
          }
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        // Initialize empty user object if parsing fails
        localStorage.setItem('user', JSON.stringify({ user_name: "Guest User" }));
      }
    } else {
      // Create a default user in localStorage for development
      localStorage.setItem('user', JSON.stringify({ user_name: "Guest User" }));
    }
  }, [navigate]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleConfirm = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    try {
      setLoading(true);
      
      // Get the current user data
      let user = { user_name: "Guest User" };
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
      
      // Update the backend with the selected role
      // Create form data to update profile
      const formData = new FormData();
      const updateData = {
        identity: [selectedRole], // Make sure it's an array
        has_completed_profile: selectedRole === 'pet_owner' // Only mark as completed for pet owners
      };
      
      // Add default fields for vets
      if (selectedRole === 'vet') {
        updateData.specialty = 'General Veterinarian';
        // Add basic availability structure
        updateData.availability = {
          Monday_Morning: false,
          Monday_Afternoon: false,
          Tuesday_Morning: false,
          Tuesday_Afternoon: false,
          Wednesday_Morning: false,
          Wednesday_Afternoon: false,
          Thursday_Morning: false, 
          Thursday_Afternoon: false,
          Friday_Morning: false,
          Friday_Afternoon: false
        };
      }
      
      formData.append('data', JSON.stringify(updateData));
      
      // Make the API call to update the user's profile
      await axios.post('/api/complete_profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      
      // Update user's identity in localStorage too
      user.identity = Array.isArray(user.identity) ? 
        [...user.identity.filter(r => r !== 'vet' && r !== 'pet_owner'), selectedRole] : 
        [selectedRole];
      
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect based on the selected role
      if (selectedRole === 'vet') {
        // For vets, go to the vet profile form to complete additional details
        navigate('/vet-profile-form');
      } else {
        // For pet owners, go directly to the vet list
        navigate('/vet-list');
      }
    } catch (err) {
      setError('Failed to update role. Please try again.');
      console.error('Error updating role:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Welcome to Vet Service Tracking
        </Typography>
        
        <Typography variant="body1" paragraph align="center">
          Please select your role to continue. This selection will determine which features you can access.
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' }}}>
            <Paper 
              elevation={selectedRole === 'pet_owner' ? 8 : 2}
              sx={{ 
                p: 3, 
                textAlign: 'center',
                border: selectedRole === 'pet_owner' ? '2px solid #4caf50' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': { boxShadow: 6 }
              }}
              onClick={() => handleRoleSelect('pet_owner')}
            >
              <Typography variant="h5" gutterBottom>Pet Owner</Typography>
              <Typography variant="body1">
                Book appointments for your pets, view vet schedules, and track service progress.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' }}}>
            <Paper 
              elevation={selectedRole === 'vet' ? 8 : 2}
              sx={{ 
                p: 3, 
                textAlign: 'center',
                border: selectedRole === 'vet' ? '2px solid #4caf50' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': { boxShadow: 6 }
              }}
              onClick={() => handleRoleSelect('vet')}
            >
              <Typography variant="h5" gutterBottom>Veterinarian</Typography>
              <Typography variant="body1">
                Manage appointment requests, track ongoing visits, and document pet health records.
              </Typography>
              {selectedRole === 'vet' && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  You'll need to provide additional professional information in the next step.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        <Box display="flex" justifyContent="center">
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleConfirm}
            disabled={!selectedRole || loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Updating...' : 'Confirm Selection'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RoleSelection; 