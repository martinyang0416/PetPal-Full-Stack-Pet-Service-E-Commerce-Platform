// components/ServiceBoardComponents/ServiceReviewForm.jsx
import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
} from '@mui/material';

const categoryToStringMap = {
  'pet_spa': 'pet spa',
  'pet_walking': 'pet walking',
  'pet_daycare': 'pet daycare',
  'pet_house_sitting': 'door-to-door pet sitting',
};

const ServiceReviewForm = ({ serviceType, serviceCategory, formData, setFormData }) => {
  const displayOrDefault = (key) => {
    console.log('FormData:', formData);
    const value = formData?.[key];
    return value && value !== '' ? value : '---';
  };

  const displayCategory = categoryToStringMap[serviceCategory] || 'Unknown';

  // Helper: format availability as date range
  const displayAvailability = () => {
    const start = formData?.availableStart;
    const end = formData?.availableEnd;
    if (start && end) {
      return `${start} - ${end}`;
    }
    return '---';
  };

  const isRequest = serviceType === 0;

  // const handleSubmit = async () => {
  //   try {
  //     const res = await fetch('/api/service', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(formData),
  //     });

  //     if (!res.ok) throw new Error('Failed to save service');
  //     alert('Service submitted successfully!');
  //   } catch (err) {
  //     alert('Error submitting: ' + err.message);
  //   }
  // };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Review your {displayCategory} service {isRequest ? 'request' : 'offer'}
      </Typography>

      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography><strong>Username:</strong> {displayOrDefault('userName')}</Typography>
            </Grid>

            <Grid container item xs={12} spacing={2}>
              <Grid item xs={6}>
                <Typography><strong>First Name:</strong> {displayOrDefault('firstName')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography><strong>Last Name:</strong> {displayOrDefault('lastName')}</Typography>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography><strong>Pet Name:</strong> {displayOrDefault('petName')}</Typography>
            </Grid>

            <Grid container item xs={12} spacing={2}>
              <Grid item xs={6}>
                <Typography><strong>Pet Type:</strong> {displayOrDefault('petType')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography><strong>Pet Breed:</strong> {displayOrDefault('petBreed')}</Typography>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography><strong>Location:</strong> {displayOrDefault('location')}</Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography><strong>Availability:</strong> {displayAvailability()}</Typography>
            </Grid>

            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom><strong>Pet Image</strong></Typography>
              {formData?.pet_image ? (
                <Avatar
                  src={formData.pet_image}
                  alt="Pet"
                  sx={{ width: 100, height: 100, mx: 'auto' }}
                />
              ) : (
                <Typography variant="body2">---</Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

    </Box>
  );
};

export default ServiceReviewForm;
