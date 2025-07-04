import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const ImageUpload = ({ onImageUpload }) => {
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
        onImageUpload(file);
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                textAlign: "center",
                padding: 2,
                border: "1px dashed #ccc",
                borderRadius: 2,
            }}
        >
            {previewUrl && (
                <Box mt={2}>
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "300px" }} />
                </Box>
            )}

            <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
                id="image-upload"
            />

            <label htmlFor="image-upload">
                <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
                    Choose Image
                </Button>
            </label>
        </Box>
    );
};

export default ImageUpload;
