
import React, { useEffect, useState } from 'react';
import { Card, CardMedia, CardContent, Typography } from '@mui/material';
import { getImageById } from '../../api/serviceBoard';

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

const categoryToCardLabelMap = {
  pet_spa: "bathing",
  pet_walking: "walking",
  pet_daycare: "day-caring",
  pet_house_sitting: "house-sitting"
}

const categoryToCardLabelMap2 = {
  pet_spa: "spa",
  pet_walking: "pet walking",
  pet_daycare: "daycare",
  pet_house_sitting: "house-sitting"
}

const petTypeToCardLabelMap = {
  cat: "cat",
  dog: "dog",
  either: "both cats and dogs"
}

const ServiceCard = ({ service, onClick, scale = 1 }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const categoryImageUrlVal = categoryImageUrlMap[service.service_category];
  const defaultImageId =
    (typeof categoryImageUrlVal === 'string')
      ? categoryImageUrlVal
      : categoryImageUrlVal?.[service.pet_type] || categoryImageUrlVal?.other;

  useEffect(() => {
    let objectUrl;
    const fetchImage = async () => {
      try {
        const imageIdToUse =
          (!service.pet_image || service.pet_image === 'null' || service.pet_image === 'None')
            ? defaultImageId
            : service.pet_image;

        if (!imageIdToUse || imageIdToUse === 'null' || imageIdToUse === 'None') {
          return;
        }
        const blob = await getImageById(imageIdToUse);
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        if (defaultImageId && service.pet_image !== 'null' && service.pet_image !== defaultImageId) {
          try {
            const fallbackBlob = await getImageById(defaultImageId);
            objectUrl = URL.createObjectURL(fallbackBlob);
            setImageUrl(objectUrl);
          } catch (fallbackErr) {
            console.error("Fallback image fetch failed:", fallbackErr);
            setImageUrl(null);
          }
        }
      }
    };

    fetchImage();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [service.pet_image, service.service_category, service.pet_type]);

  const typeLabel = service.service_type === 1 ? 'An offer' : 'A request';
  const categoryLabel = categoryToCardLabelMap[service.service_category];
  const petTypeLabel = petTypeToCardLabelMap[service.pet_type];

  return (
    <Card 
      sx={{ minWidth: 200 * scale, height: 180 * scale, flexShrink: 0, cursor: 'pointer' }}
        onClick={() => onClick(service, imageUrl)}>
      <CardMedia
        component="img"
        height={120 * scale}
        image={imageUrl}
        alt="Pet"
      />
      <CardContent>
        <Typography
          variant="body2"
          sx={{ fontSize: `${0.8 * scale}rem`, lineHeight: 1 }}
        >
          { scale === 1  
            ? <strong>{`${typeLabel} for ${categoryLabel} ${petTypeLabel}`}</strong>
            : `${typeLabel} for ${categoryToCardLabelMap2[service.service_category]}`
          }
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: `${0.8 * scale}rem`, lineHeight: 1 }}
        >
          {service.availability?.start && service.availability?.end
            ? `${service.availability.start} - ${service.availability.end}`
            : 'No Date'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
