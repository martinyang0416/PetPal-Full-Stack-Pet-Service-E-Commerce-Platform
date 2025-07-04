import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Typography, Box, Paper, Stepper, Step, StepLabel, StepContent,
  Button, Card, CardContent, Divider, TextField, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Alert, CircularProgress, Chip, Avatar, LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Save as SaveIcon,
  PhotoCamera as CameraIcon,
  Edit as EditIcon,
  Timer as TimerIcon,
  MedicalServices as MedicalIcon,
  Pets as PetIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useVetService } from '../../hooks/useVetService';

const VetServiceManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Use the new state pattern hook
  const {
    service,
    serviceData,
    loading,
    error,
    stateInfo,
    confirmService,
    startService,
    completeService,
    cancelService,
    addNote,
    stateHistory,
    reload
  } = useVetService(id);
  
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [images, setImages] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  
  // Create a separate state for notes that won't be affected by useEffect
  // This ensures the local edits persist regardless of service data updates
  const [localNotes, setLocalNotes] = useState('');
  const notesInitialized = React.useRef(false);

  // Service workflow steps
  const steps = [
    { key: 'check-in', label: 'Check-in', description: 'Begin the service by checking in the pet' },
    { key: 'examination', label: 'Examination', description: 'Conduct a thorough examination of the pet' },
    { key: 'treatment', label: 'Treatment', description: 'Administer necessary treatments or procedures' },
    { key: 'checkout', label: 'Checkout', description: 'Complete the service and provide recommendations' }
  ];

  // Initialize data from service when available - update for notes
  useEffect(() => {
    if (serviceData && Object.keys(serviceData).length > 0) {
      // Store previous values to avoid unnecessary updates
      const prevImages = images;
      
      // Only initialize notes once when service data first loads
      if (!notesInitialized.current && serviceData.vetNotes !== undefined) {
        setLocalNotes(serviceData.vetNotes || '');
        notesInitialized.current = true;
      }
      
      // Only update images if they've changed
      const initialImages = serviceData.images || [];
      if (JSON.stringify(initialImages) !== JSON.stringify(prevImages)) {
        setImages(initialImages);
      }
      
      // Only update active step if tracking has changed
      if (serviceData.tracking && Array.isArray(serviceData.tracking)) {
        const completedSteps = serviceData.tracking.filter(step => step.completed);
        const newActiveStep = Math.min(completedSteps.length, steps.length - 1);
        if (activeStep !== newActiveStep) {
          setActiveStep(newActiveStep);
        }
      }
    }
  }, [serviceData, images, activeStep]);

  const handleStepComplete = async (stepIndex) => {
    if (!serviceData || stepIndex >= steps.length) {
      return;
    }
    
    try {
      setSaving(true);
      
      // If this is the first step, start the service
      if (stepIndex === 0 && stateInfo.name === 'Confirmed') {
        await startService();
      } else if (stepIndex === steps.length - 1) {
        // If completing the last step, prompt for confirmation
        setConfirmCompleteOpen(true);
        setSaving(false);
        return;
      }
      
      // Update tracking in the backend
      const updatedTracking = [...(serviceData.tracking || [])];
      if (!updatedTracking[stepIndex]) {
        // Initialize if missing
        updatedTracking[stepIndex] = { step: steps[stepIndex].key };
      }
      
      updatedTracking[stepIndex] = {
        ...updatedTracking[stepIndex],
        completed: true,
        timestamp: new Date().toISOString()
      };
      
      // Update tracking in backend
      await axios.put(`/api/vet-services/${id}`, {
        tracking: updatedTracking
      });
      
      // Move to next step if not the last one
      if (stepIndex < steps.length - 1) {
        setActiveStep(stepIndex + 1);
      }
      
      // Reload data to refresh UI
      await reload();
      
    } catch (err) {
      console.error('Error updating service status:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteServiceAction = async () => {
    try {
      setSaving(true);
      
      // Update notes before completing - use localNotes instead
      if (localNotes !== serviceData.vetNotes) {
        const noteResult = await addNote(localNotes);
        if (!noteResult || !noteResult.success) {
          console.error('Failed to save notes:', noteResult?.error || 'Unknown error');
          alert(`Failed to save notes: ${noteResult?.error || 'Unknown error'}`);
          setSaving(false);
          return;
        }
      }
      
      // Ensure service is in the correct state before completing
      if (stateInfo.name !== 'In Progress') {
        console.error('Service must be in progress before it can be completed');
        alert('Service must be in progress before it can be completed. Please start the service first.');
        setSaving(false);
        setConfirmCompleteOpen(false);
        return;
      }
      
      // Mark the last step (checkout) as completed
      const updatedTracking = [...(serviceData.tracking || [])];
      const checkoutIndex = steps.length - 1;
      
      if (!updatedTracking[checkoutIndex]) {
        // Initialize if missing
        updatedTracking[checkoutIndex] = { step: steps[checkoutIndex].key };
      }
      
      updatedTracking[checkoutIndex] = {
        ...updatedTracking[checkoutIndex],
        completed: true,
        timestamp: new Date().toISOString()
      };
      
      // Update tracking in backend
      await axios.put(`/api/vet-services/${id}`, {
        tracking: updatedTracking
      });
      
      // Let the UI update before continuing to complete service
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use the state pattern to complete the service
      const result = await completeService();
      
      if (result && result.success) {
        // Reload to refresh UI before navigating away
        await reload();
        
        // Close dialog and redirect to dashboard
        setConfirmCompleteOpen(false);
        
        // Add a small delay before navigating away
        setTimeout(() => {
          navigate('/vet-dashboard');
        }, 500);
      } else {
        console.error('Error completing service:', result?.error || 'Unknown error');
        alert(`Failed to complete service: ${result?.error || 'Unknown error'}`);
        setConfirmCompleteOpen(false);
      }
    } catch (err) {
      console.error('Error completing service:', err);
      alert(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSaving(true);
      
      // Use the state pattern hook to add a note - use localNotes
      const result = await addNote(localNotes);
      
      if (result && result.success) {
        // Reload data to refresh UI
        await reload();
        alert('Notes saved successfully!');
      } else {
        alert('Failed to save notes: ' + (result?.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
    setSelectedFile(null);
    setPreviewUrl('');
    setImageCaption('');
  };

  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;
    
    try {
      setSaving(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('caption', imageCaption);
      formData.append('serviceId', id);
      
      // Upload image to server - using the correct endpoint from backend
      const response = await axios.post('/api/vet-services/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Get the image URL from the response
      const imageData = response.data;
      
      // Create new image object with absolute URL to ensure it loads correctly
      const imageUrl = `/api/images/${imageData.imageId}`;
      const newImage = {
        url: imageUrl,
        caption: imageCaption,
        imageId: imageData.imageId,
        timestamp: new Date().toISOString()
      };
      
      // Update local state
      const updatedImages = [...images, newImage];
      setImages(updatedImages);
      
      // Update service in API with complete image data
      await axios.put(`/api/vet-services/${id}`, {
        images: updatedImages.map(img => ({
          url: img.url,
          caption: img.caption,
          imageId: img.imageId,
          timestamp: img.timestamp
        }))
      });
      
      // Reload data to refresh UI
      await reload();
      
      // Close dialog
      setUploadDialogOpen(false);
      alert('Image uploaded successfully');
    } catch (err) {
      console.error('Error uploading image:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          Loading service details...
        </Typography>
      </Container>
    );
  }

  if (!serviceData || Object.keys(serviceData).length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Service not found or has been deleted.
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<BackIcon />}
          onClick={() => navigate('/vet-dashboard')}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        variant="outlined" 
        startIcon={<BackIcon />}
        onClick={() => navigate('/vet-dashboard')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          {/* Service Info Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" gutterBottom>
                  Service Details
                </Typography>
                <Chip 
                  label={stateInfo.name}
                  color={stateInfo.color}
                  variant="outlined"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Service Type:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {getServiceLabel(serviceData.serviceCategory)}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Scheduled Time:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {serviceData.timeSlot?.split('_').join(', ')}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Service Method:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {serviceData.serviceType === 'in_person' ? 'In-person Visit' : 'Mobile Service'}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PetIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1">
                    Pet Information
                  </Typography>
                </Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Name:</strong> {serviceData.petName}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Species:</strong> {serviceData.petSpecies}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Breed:</strong> {serviceData.petBreed}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                    {serviceData.ownerName?.charAt(0) || 'O'}
                  </Avatar>
                  <Typography variant="subtitle1">
                    Owner Information
                  </Typography>
                </Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Name:</strong> {serviceData.ownerName || 'Unknown Owner'}
                </Typography>
                {serviceData.ownerContact && (
                  <>
                    <Typography variant="body1" gutterBottom>
                      <strong>Phone:</strong> {serviceData.ownerContact.phone || serviceData.ownerContact.phone_number || 'Not provided'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Email:</strong> {serviceData.ownerContact.email || 'Not provided'}
                    </Typography>
                  </>
                )}
              </Box>
              
              {/* State Actions */}
              {stateInfo.nextActions && stateInfo.nextActions.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Available Actions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {stateInfo.nextActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="contained"
                          color={action.color}
                          size="small"
                          onClick={() => {
                            // Call the appropriate method based on action name
                            if (action.method === 'completeService') {
                              setConfirmCompleteOpen(true);
                            } else if (typeof service[action.method] === 'function') {
                              service[action.method]();
                            }
                          }}
                        >
                          {action.name}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Client Notes */}
          {serviceData.notes && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Client Notes
                </Typography>
                <Typography variant="body1" paragraph>
                  {serviceData.notes}
                </Typography>
              </CardContent>
            </Card>
          )}
          
          {/* Upload Images Section */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Medical Images
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<CameraIcon />} 
                  onClick={handleOpenUploadDialog}
                  disabled={stateInfo.name === 'Completed'}
                >
                  Upload
                </Button>
              </Box>
              
              {images.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No images uploaded yet
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {images.map((image, index) => (
                    <Grid item xs={6} key={index}>
                      <Paper sx={{ p: 1 }}>
                        <Box 
                          component="img" 
                          src={image.url.startsWith('http') ? image.url : `${axios.defaults.baseURL}${image.url}`}
                          alt={image.caption || `Medical image ${index + 1}`}
                          sx={{ 
                            width: '100%', 
                            height: 100, 
                            objectFit: 'cover',
                            borderRadius: 1,
                            mb: 1,
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(image.url.startsWith('http') ? image.url : `${axios.defaults.baseURL}${image.url}`, '_blank')}
                        />
                        <Typography variant="caption" display="block">
                          {image.caption || `Image ${index + 1}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatDate(image.timestamp)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {/* Progress Stepper */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineIcon sx={{ mr: 1 }} />
              Service Progress Tracker
            </Typography>
            
            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 3 }}>
              {steps.map((step, index) => {
                const stepCompleted = serviceData.tracking?.[index]?.completed;
                const stepTimestamp = serviceData.tracking?.[index]?.timestamp;
                
                return (
                  <Step key={step.key} completed={stepCompleted}>
                    <StepLabel
                      StepIconProps={{
                        icon: stepCompleted ? <CheckCircleIcon color="success" /> : index + 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1">{step.label}</Typography>
                        {stepTimestamp && (
                          <Chip 
                            icon={<TimerIcon fontSize="small" />}
                            label={formatDate(stepTimestamp)}
                            variant="outlined"
                            size="small"
                            sx={{ ml: 2 }}
                          />
                        )}
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {step.description}
                      </Typography>
                      
                      {activeStep === index && !stepCompleted && stateInfo.name !== 'Completed' && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="contained"
                            onClick={() => handleStepComplete(index)}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                          >
                            {saving ? 'Saving...' : `Complete ${step.label}`}
                          </Button>
                        </Box>
                      )}
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          </Paper>
          
          {/* Medical Notes */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                <MedicalIcon sx={{ mr: 1 }} />
                Medical Notes
              </Typography>
              
              {stateInfo.name !== 'Completed' && (
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />}
                  onClick={handleSaveNotes}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Notes'}
                </Button>
              )}
            </Box>
            
            {/* Debug info - will show current notes value */}
            <Box sx={{ mb: 1, p: 1, bgcolor: 'background.paper', border: '1px dashed grey', borderRadius: 1, display: 'none' }}>
              <Typography variant="caption">
                Current notes value (length: {localNotes ? localNotes.length : 0}): {JSON.stringify(localNotes)}
              </Typography>
            </Box>
            
            {/* Use a simple textarea with controlled value for maximum compatibility */}
            <textarea
              placeholder="Enter your medical observations, diagnosis, and recommendations here..."
              value={localNotes}
              onChange={(e) => {
                setLocalNotes(e.target.value);
                console.log('Notes changed:', e.target.value);
              }}
              disabled={stateInfo.name === 'Completed' || saving}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                fontSize: '16px',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: stateInfo.name === 'Completed' || saving ? '#f5f5f5' : 'white',
              }}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              These notes will be shared with the pet owner after you complete the service.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Image Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-modal="true"
        slotProps={{
          backdrop: {
            sx: { inert: uploadDialogOpen ? undefined : 'true' }
          }
        }}
      >
        <DialogTitle>
          Upload Medical Image
          <IconButton
            aria-label="close"
            onClick={() => setUploadDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CameraIcon />}
              fullWidth
              sx={{ height: 56 }}
            >
              Select Image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelect}
              />
            </Button>
          </Box>
          
          {previewUrl && (
            <Box 
              sx={{ 
                width: '100%', 
                height: 200, 
                backgroundImage: `url(${previewUrl})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: 1,
                mb: 3
              }}
            />
          )}
          
          <TextField
            fullWidth
            label="Image Caption"
            placeholder="Enter a description for this image"
            value={imageCaption}
            onChange={(e) => setImageCaption(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleUploadImage}
            disabled={!selectedFile || saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Uploading...' : 'Upload Image'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Complete Dialog */}
      <Dialog
        open={confirmCompleteOpen}
        onClose={() => setConfirmCompleteOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-modal="true"
        slotProps={{
          backdrop: {
            sx: { inert: confirmCompleteOpen ? undefined : 'true' }
          }
        }}
      >
        <DialogTitle>Complete Service</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Once you complete this service, you won't be able to make further changes.
          </Alert>
          <Typography variant="body1" paragraph>
            Are you sure you want to mark this service as completed? This will finalize all notes and images.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCompleteOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCompleteServiceAction}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {saving ? 'Completing...' : 'Complete Service'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VetServiceManagement; 