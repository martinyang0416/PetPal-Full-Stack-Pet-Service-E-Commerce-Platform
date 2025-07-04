import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Card, CardContent, 
  CardActions, Button, Avatar, Chip, LinearProgress, TextField,
  InputAdornment, Alert
} from '@mui/material';
import { Grid } from '@mui/material';
import { Search as SearchIcon, LocationOn as LocationIcon, MedicalServices as MedicalIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VetList = () => {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVets = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/vets');
        setVets(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching vets:', err);
        setError('Failed to load veterinarians. Please try again later.');
        setVets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVets();
  }, []);

  const handleViewVetDetails = (vetId) => {
    navigate(`/vet-details/${vetId}`);
  };

  // Filter vets based on search term
  const filteredVets = vets.filter(vet => 
    vet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vet.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vet.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vet.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to display availability in a readable format
  const formatAvailability = (availability) => {
    if (!availability) return 'Contact for availability';
    
    const availableSlots = [];
    Object.entries(availability).forEach(([slot, isAvailable]) => {
      if (isAvailable) {
        const [day, time] = slot.split('_');
        availableSlots.push(`${day} ${time}`);
      }
    });
    
    return availableSlots.length > 0 
      ? availableSlots.slice(0, 3).join(', ') + (availableSlots.length > 3 ? ' & more' : '')
      : 'Limited availability';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Find a Veterinarian
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search by name, specialty, or location..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredVets.map((vet) => (
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6', lg: 'span 4' } }} key={vet._id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={vet.profile_picture} 
                      sx={{ width: 56, height: 56, mr: 2 }}
                    >
                      {vet.name ? vet.name.charAt(0) : 'V'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div">
                        {vet.name || 'Unknown Name'}
                      </Typography>
                      <Chip 
                        icon={<MedicalIcon fontSize="small" />} 
                        label={vet.specialty || 'General Veterinarian'} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {vet.bio || 'No biography available'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {vet.location?.city && vet.location?.state 
                        ? `${vet.location.city}, ${vet.location.state}`
                        : 'Location not specified'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Available:</strong> {formatAvailability(vet.availability)}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => handleViewVetDetails(vet._id)}
                  >
                    View Profile
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          
          {filteredVets.length === 0 && (
            <Box sx={{ width: '100%', mt: 2, textAlign: 'center' }}>
              <Typography variant="h6">
                No veterinarians found matching your search criteria.
              </Typography>
            </Box>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default VetList; 