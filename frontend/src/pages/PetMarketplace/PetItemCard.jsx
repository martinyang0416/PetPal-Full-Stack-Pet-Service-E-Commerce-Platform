import React from "react";
import './PetMarketplace.css';
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
} from "@mui/material";

const PetItemCard = ({ pet }) => {
    const navigate = useNavigate();

    console.log("🐶 Pet in PetItemCard:", pet); 
  return (
    <Card className="pet-card" 
    onClick={() => navigate(`/market_place/${pet._id}`)} 
    sx={{ cursor: "pointer" }}
>
      <CardMedia
        component="img"
        height="180"
        image={
            pet.image && (pet.image.startsWith("http") || pet.image.startsWith("/"))
            ? pet.image
            : pet.image
            ? `http://localhost:5000/pets/image/${pet.image}`
            : "/image/catTree.jpg" 
        }
        alt={pet.name}
        className="pet-card"
        />
      <CardContent className="pet-card-content">
        <Typography variant="h6" fontWeight="bold" color="primary">
          {pet.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pet.type} -- {pet.condition}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          ${pet.price} | {typeof pet.distance === 'number' ? `${pet.distance} km away` : "Distance unknown"}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PetItemCard;
