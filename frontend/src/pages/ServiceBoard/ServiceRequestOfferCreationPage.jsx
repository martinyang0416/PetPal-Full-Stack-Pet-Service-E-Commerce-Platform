// pages/ServiceRequestOfferCreationPage.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    Step,
    StepLabel,
    Stepper,
    Typography
 } from '@mui/material';

import {
  postOffer,
  postRequest
} from "../../api/serviceBoard";



import ServiceSelectionForm from '../../components/ServiceBoardComponents/ServiceSelectionForm';
import ServiceDetailForm from '../../components/ServiceBoardComponents/ServiceDetailForm';
import ServiceReviewForm from '../../components/ServiceBoardComponents/ServiceReviewForm';

const steps = ['Service type selection', 'Info and details', 'Review your service'];
function getStepContent(step, formData, setFormData) {
    switch (step) {
      case 0:
        return <ServiceSelectionForm 
            formData={formData}
            setFormData={setFormData} 
          />;
      case 1:
        return (
          <ServiceDetailForm
            serviceType={formData.serviceType}
            serviceCategory={formData.serviceCategory}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 2:
        return (
          <ServiceReviewForm 
            serviceType={formData.serviceType}
            serviceCategory={formData.serviceCategory}
            formData={formData}
            setFormData={setFormData}
            />
        );
      default:
        throw new Error('Unknown step');
    }
  }

export default function ServiceRequestOfferCreationPage() {
  const { state } = useLocation();               // gets whatever put in Link
  const defaultCategory = state?.defaultCategory ?? '';   // fallback if user types URL
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    serviceType: 0, // 0 for request, 1 for offer
    serviceCategory: defaultCategory,
    // Add more fields for later forms
  });

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleSubmit = async () => {
    try {
      const formDataToSend = new FormData();
      for (const key in formData) {
        if (key === "coordinates" && Array.isArray(formData.coordinates)) {
          formData.coordinates.forEach((coord) => {
            formDataToSend.append("coordinates", coord);
          });
        } else if (key === "petImage" && formData.petImage instanceof File) {
          formDataToSend.append("petImage", formData.petImage);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      }
      if (formData.serviceType === 1) { // Offer
        const res = await postOffer(formDataToSend);

        if (res.status === 201) {
          window.location.href = "/service_board";
        } else {
          alert("Failed to submit service offer: " + res.data.error || "Unknown error");
        }
      } else if (formData.serviceType === 0) {
        const res = await postRequest(formDataToSend);

        if (res.status === 201) {
          window.location.href = "/service_board";
        } else {
          alert("Failed to submit service request: " + res.data.error || "Unknown error");
        }
      }
      
    } catch (err) {
      console.error("Error submitting request:", err);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Create a Service Request / Offer
      </Typography>
      <Stepper activeStep={activeStep} sx={{ my: 4 }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
      <Box>{getStepContent(activeStep, formData, setFormData, defaultCategory)}</Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
        <Button
          variant="contained"
          onClick={async () => {
            if (activeStep === steps.length - 1) {
              await handleSubmit(); // Call postRequest here
            } else {
              handleNext(); // Continue to next step
            }
          }}
        >
          {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
        </Button>

      </Box>
    </Container>
  );
}
