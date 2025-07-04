import React, { useEffect, useState } from 'react';
import {
  Box, Typography,Card, CardContent, Fab
} from '@mui/material';
import { Add as AddIcon, Pets as PetsIcon, Sort as SortIcon, FilterAlt as FilterAltIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { 
  getServices,
  getImageById,
  getFilteredServices,
  sortServices
 } from '../../api/serviceBoard'; // Adjust the import path as necessary

import {
  getCurrentUser
} from '../../api/auth';

import ServiceCard from '../../components/ServiceBoardComponents/ServiceCard';
import ServiceCardDialog from '../../components/ServiceBoardComponents/ServiceCardDialog'
import FilterAndSortBar from '../../components/ServiceBoardComponents/FilterAndSortBar';


const categoryToDisplayNameMap = {
  pet_spa: "Bathing Pet Spas",
  pet_walking: "Dog / Cat Walking",
  pet_daycare: "Daycares",
  pet_house_sitting: "House Sitting",
};

const categorySubtitleMap = {
  pet_spa: "Pamper our pets with grooming and spa.",
  pet_walking: "Daily walks for a happy pet.",
  pet_daycare: "Taking care of pets in the sitter's place.",
  pet_house_sitting: "Door-to-door care for unattended pets.",
};

const categoryImageUrlMap = {
  pet_spa: {
    cat: process.env.REACT_APP_SERVICE_BOARD_SPA_CAT_IMAGE_ID,
    dog: process.env.REACT_APP_SERVICE_BOARD_SPA_DOG_IMAGE_ID,
    other: process.env.REACT_APP_SERVICE_BOARD_SPA_FIRST_IMAGE_ID,
  },
  pet_walking: process.env.REACT_APP_SERVICE_BOARD_WALKING_IMAGE_ID,
  pet_daycare: process.env.REACT_APP_SERVICE_BOARD_DAYCARE_IMAGE_ID,
  pet_house_sitting: process.env.REACT_APP_SERVICE_BOARD_HOUSE_SITTING_IMAGE_ID,
};

const FirstAddServiceCard = ({ category, serviceName }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const categoryImageUrlVal = categoryImageUrlMap[category];

  const defaultImageId = 
    typeof categoryImageUrlVal === 'string'
      ? categoryImageUrlVal
      : categoryImageUrlVal?.other;

  useEffect(() => {
    let objectUrl;

    const fetchImage = async () => {
      try {
        const blob = await getImageById(defaultImageId);
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        console.error(`Failed to load first-card image for ${category}:`, err);
      }
    };

    fetchImage();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [category]);

  return (
    <Card
      sx={{
        width: 200,
        height: 180,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          zIndex: 0,
        },
      }}
    >
      <CardContent
        sx={{
          position: 'relative',
          height: '100%',
          cursor: 'pointer',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          zIndex: 1,
        }}
      >
        <Link
          to="/service_creation"
          state={{ defaultCategory: category }} 
          style={{ textDecoration: 'none' }}
        >
          <Fab color="primary" aria-label="add" size="medium" sx={{ mt: 1 }}>
            <AddIcon />
          </Fab>
        </Link>
        <Typography
          variant="body2"
          sx={{ mt: 1, wordBreak: 'break-word', textAlign: 'center' }}
        >
          {serviceName}
        </Typography>
      </CardContent>
    </Card>
  );
};



const ScrollableCardRow = ({ category, serviceName, services, handleOpenDialog }) => (
  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <Typography variant="h6">{categoryToDisplayNameMap[category]}</Typography>
    <Typography variant="body2" color="text.secondary" mb={1}>
      {categorySubtitleMap[category]}
    </Typography>
    <Box sx={{ display: 'flex', overflowX: 'auto', gap: 2, pb: 1 }}>
      <FirstAddServiceCard category={category} serviceName={serviceName} />
      {/* Dynamic service cards */}
      {services.map((service => 
        <ServiceCard key={service._id} service={service} onClick={handleOpenDialog} />
      ))}
    </Box>
  </Box>
);


export default function ServiceBoardPage() {
  const [servicesByCategory, setServicesByCategory] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceImage, setSelectedServiceImage] = useState(null);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    serviceType: '',
    serviceCategory: '',
    petType: '',
    hasImage: '',
    hasLocation: '',
    myServicesOnly: false,
  });
  const [allServices, setAllServices] = useState([]);  // fetched once
  const [sortOptions, setSortOptions] = useState({
    by: 'Post Time',
    order: 'asc',
  });

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

  const handleFilterChange = async (newFilters) => {
   // skip if every field is empty / false
    const noRealFilter = Object.values(newFilters).every(
      v => v === '' || v === false
    );
    if (noRealFilter) return;        // <-- do not hit the backend, keep existing rows
    try {
      const user = await getCurrentUser();
      setUser(user.user_name);
  
      const enrichedFilters = {
        ...newFilters,
        userName: newFilters.myServicesOnly ? user.user_name : undefined,
      };
  
      const data = await getFilteredServices(enrichedFilters);
      categoriseAndStore(data);
    } catch (err) {
      console.error('Failed to apply filters:', err);
    }
  };
  

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();
        setAllServices(data);  
        const categorized = {};
        data.forEach(service => {
          const cat = service.service_category;
          if (!categorized[cat]) categorized[cat] = [];
          categorized[cat].push(service);
        });
        setServicesByCategory(categorized);
      } catch (err) {
        console.error('Failed to fetch services:', err);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
        setUser(data.user_name);
      } catch (err) {
        console.error("❌ Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const categoriseAndStore = (serviceArray) => {
    const grouped = {};
    serviceArray.forEach(s => {
      const cat = s.service_category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });
    setServicesByCategory(grouped);
  };
  

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices();          // backend default order
        setAllServices(data);                      // keep original list
  
        // initial categorised view, still respecting current sortOptions
        const sorted = await sortServices(data, sortOptions);
        categoriseAndStore(sorted);
      } catch (err) {
        console.error('Failed to fetch services:', err);
      }
    };
    fetchServices();
  }, []);
  
  
  useEffect(() => {
    const applySort = async () => {
      const sorted = await sortServices(allServices, sortOptions);
      categoriseAndStore(sorted);          // <<< per‑category rows preserved
    };
    applySort();
  }, [allServices, sortOptions]);
  
  

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', p: 2 }}>
      <Typography variant="h4" gutterBottom>Service Board</Typography>

      <FilterAndSortBar
        filters={filters}
        setFilters={setFilters}
        sortOptions={sortOptions}
        setSortOptions={setSortOptions}
        onFilterChange={handleFilterChange}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <ScrollableCardRow
          category="pet_spa"
          serviceName="Become a pet spa provider!"
          services={servicesByCategory["pet_spa"] || []}
          handleOpenDialog={handleOpenDialog}
        />
        <ScrollableCardRow
          category="pet_walking"
          serviceName="Post a pet walking request or offer!"
          services={servicesByCategory["pet_walking"] || []}
          handleOpenDialog={handleOpenDialog}
        />
        <ScrollableCardRow
          category="pet_daycare"
          serviceName="Post a daycare request or offer!"
          services={servicesByCategory["pet_daycare"] || []}
          handleOpenDialog={handleOpenDialog}
        />
        <ScrollableCardRow
          category="pet_house_sitting"
          serviceName="Post a house sitting request or offer!"
          services={servicesByCategory["pet_house_sitting"] || []}
          handleOpenDialog={handleOpenDialog}
        />
      </Box>
      <ServiceCardDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        service={selectedService}
        imageUrl={selectedServiceImage}
        currentUser={user}
      />


    </Box>
  );
}
