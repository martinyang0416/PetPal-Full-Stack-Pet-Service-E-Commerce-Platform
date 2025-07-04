// components/UserInfoFields.jsx
import React from 'react';
import { FormLabel, Grid, OutlinedInput } from '@mui/material';
import { styled } from '@mui/material/styles';

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const UserInfoFields = ({ formData, handleInputChange }) => (
    <>
        <FormGrid item xs={12} md={6}>
            <FormLabel required htmlFor="userName">Your username</FormLabel>
            <OutlinedInput
            id="userName"
            name="userName"
            value={formData.userName || ''}
            onChange={handleInputChange}
            required
            size="small"
            placeholder="johndoe"
            />
        </FormGrid>
    </>
);

export default UserInfoFields;