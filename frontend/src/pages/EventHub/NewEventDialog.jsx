// NewEventDialog.jsx
import React, { useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    Box,
} from "@mui/material";
import ImageUpload from "./ImageUpload";
import MapPicker from "./MapPicker";
import { postEvent } from "../../api/event";

const NewEventDiaglog = ({ open, onClose }) => {
    const [image, setImage] = React.useState(null);
    const [location, setLocation] = React.useState(null);
    const [date, setDate] = React.useState("");
    const [time, setTime] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [eventName, setEventName] = React.useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image || !location || !date || !time || !description || !eventName) {
            alert("Please fill in all fields.");
            return;
        }
        const eventData = {
            name: eventName,
            description: description,
            date: date,
            time: time,
            location: location,
            image: image,
        };
        console.log("Event Data:", eventData);
        try {
            const response = await postEvent(eventData);
            console.log("Response from server:", response);
            if (response) {
                alert("Event created successfully!");
                onClose();
            } else {
                alert("Failed to create event. Please try again.");
            }
        } catch (error) {
            console.error("Error creating event:", error);
            alert("An error occurred while creating the event.");
        }
    };

    useEffect(() => {
        if (image) {
            console.log("Image selected to submit:", image);
        }
    }, [image]);

    useEffect(() => {
        if (location) {
            console.log("Location selected:", location);
        }
    }, [location]);

    return (
        <>
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogContent>
                    <DialogContentText>Choose an image for your event.</DialogContentText>

                    {/* Image Upload */}
                    <ImageUpload onImageUpload={(image) => setImage(image)} />

                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="title"
                        name="title"
                        label="Event Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        onChange={(e) => setEventName(e.target.value)}
                    />
                    <TextField
                        required
                        margin="dense"
                        id="description"
                        name="description"
                        label="Description"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        variant="standard"
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                        <TextField
                            required
                            margin="dense"
                            id="date"
                            name="date"
                            type="date"
                            sx={{ flex: 1 }}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <TextField
                            required
                            margin="dense"
                            id="time"
                            name="time"
                            type="time"
                            sx={{ flex: 1 }}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </Box>

                    {/* Location Picker */}
                    <DialogContentText sx={{ mt: 2 }}>Pick a location for the event.</DialogContentText>
                    <MapPicker onAddressSelect={(address) => setLocation(address)} />
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Add</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default NewEventDiaglog;
