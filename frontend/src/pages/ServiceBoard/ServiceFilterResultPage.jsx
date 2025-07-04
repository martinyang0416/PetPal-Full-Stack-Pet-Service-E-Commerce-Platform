// src/pages/ServiceFilterResultPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography, 
  Grid, 
  Button } from '@mui/material';
import { getServices, deleteService, getFilteredServices } from '../../api/serviceBoard';
import { getCurrentUser } from '../../api/auth';
import ServiceCard from '../../components/ServiceBoardComponents/ServiceCard';
import ServiceCardDialog from '../../components/ServiceBoardComponents/ServiceCardDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatListBulletedAddIcon from '@mui/icons-material/FormatListBulletedAdd';
import bannerBackgroundImage from '../../Assets/img/service_board_footprint.jpg'

const ConfirmDialog = ({ open, title, content, onCancel, onConfirm }) => (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="secondary" variant="outlined">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  
export default function ServiceFilterResultPage() {
  const [services, setServices] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceImage, setSelectedServiceImage] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const handleDeleteClick = (serviceId) => {
    setPendingDeleteId(serviceId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteService(pendingDeleteId);
      setServices((prev) => prev.filter((s) => s._id !== pendingDeleteId));
      setConfirmOpen(false);
      setPendingDeleteId(null);
    } catch (err) {
      console.error("❌ Failed to delete:", err);
      alert("Delete failed.");
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user.user_name);

        const filters = {};
        for (const [key, value] of searchParams.entries()) {
          if (value === 'true' || value === 'false') {
            filters[key] = value === 'true';
          } else if (value === 'all') {
            filters[key] = 'either';
          } else {
            filters[key] = value;
          } 
        }

        filters.userName = filters.myServicesOnly ? user.user_name : undefined;
        if (filters.serviceType === 'request') filters.serviceType = 0;
        if (filters.serviceType === 'offer') filters.serviceType = 1;
        const result = await getFilteredServices(filters);
        setServices(result);
      } catch (err) {
        console.error("Error fetching filtered services:", err);
      }
    };

    fetchData();
  }, [searchParams]);
  

  const handleOpenDialog = (service, imageUrl) => {
    setSelectedService(service);
    setSelectedServiceImage(imageUrl);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedService(null);
    setSelectedServiceImage(null);
  };


  const filterLabels = {
    serviceType: "Service Type",
    serviceCategory: "Category",
    petType: "Pet",
    hasLocation: "Has Location",
    hasImage: "Has Image",
    hasRealName: "Has Real Name",
  };

  const parsedFilters = Array.from(searchParams.entries())
    .filter(([key, val]) => key !== 'myServicesOnly') // exclude myServicesOnly for chips
    .map(([key, val]) => ({
      label: `${filterLabels[key] || key}: ${val}`,
      key,
    }));

  const isMyServices = searchParams.get("myServicesOnly") === "true";


  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h4" gutterBottom>
          Service Board
        </Typography>

        <Link to="/service_board" style={{ textDecoration: 'none' }}>
          <IconButton color="primary" aria-label="Back to Service Board">
            <FormatListBulletedAddIcon />
          </IconButton>
        </Link>
      </Box>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 60,
          borderRadius: 4,
          mb: 3,
          overflow: 'hidden',
        }}
      >
        {/* Background layer */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${bannerBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.5,
            zIndex: 0,
          }}
        />

        {/* Foreground: Filter Preview */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMyServices ? 'center' : 'flex-start',
            px: 2,
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {isMyServices ? (
            <Typography variant="h6" sx={{ color: 'black' }}>
              My Services
            </Typography>
          ) : parsedFilters.length === 0 ? (
            <Typography variant="h6" sx={{ color: 'black' }}>
              All Services
            </Typography>
          ) : (
            parsedFilters.map(filter => (
              <Chip
                key={filter.key}
                label={filter.label}
                variant="outlined"
                sx={{ bgcolor: 'rgba(255,255,255,0.8)', color: 'black', fontWeight: 500 }}
              />
            ))
          )}
        </Box>
      </Box>



      <Grid container spacing={2}>
        {services.map((service) => (
          <Grid item xs={12} sm={6} key={service._id}>
            <Box sx={{ position: 'relative' }}>
              <ServiceCard service={service} onClick={handleOpenDialog} scale={0.82}/>
              { service.user_name === currentUser && (
                <Box sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  display: 'flex', 
                  zIndex: 2
                }}>
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => handleDeleteClick(service._id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>


      <ServiceCardDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        service={selectedService}
        imageUrl={selectedServiceImage}
        currentUser={currentUser}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Deletion"
        content="Are you sure you want to delete this service post? This action cannot be undone."
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

    </Box>
  );
}
