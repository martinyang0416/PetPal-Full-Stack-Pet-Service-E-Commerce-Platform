import React, { useEffect, useState } from "react";
import { getCurrentUser } from "../../api/auth";
import {
    Container,
    Grid,
    Card,
    CardHeader,
    CardMedia,
    CardContent,
    CardActions,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { toggleAttendance, deleteEvent } from "../../api/event";

const base_api_url = process.env.REACT_APP_BASE_URL;

const RegisterButton = ({ event_id }) => {
    return (
        <Button size="small" color="primary" onClick={() => toggleAttendance(event_id)}>
            Add to Calendar
        </Button>
    );
};

const UnregisterButton = ({ event_id }) => {
    return (
        <Button size="small" color="primary" onClick={() => toggleAttendance(event_id)}>
            Remove from Calendar
        </Button>
    );
};

// The grid layout for the event cards
const ResponsiveGrid = ({ eventList, user }) => {
    // const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuEventId, setMenuEventId] = useState(null);

    const handleMenuOpen = (event, eventId) => {
        setAnchorEl(event.currentTarget);
        setMenuEventId(eventId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuEventId(null);
    };

    const handleUpdateEvent = (id) => {
        console.log("Update event with ID:", id);
    };

    const handleDeleteEvent = (id) => {
        console.log("Delete event with ID:", id);
        deleteEvent(id)
            .then(() => {
                console.log("Event deleted successfully");
                // Optionally, you can refresh the event list here
            })
            .catch((error) => {
                console.error("Error deleting event:", error);
            });
    };

    if (!user) {
        return <Typography>Loading user...</Typography>;
    }

    return (
        <Container sx={{ marginTop: 2, marginBottom: 2 }}>
            <Grid container spacing={2}>
                {eventList.map((event) => {
                    if (!event.display) {
                        return null;
                    }
                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event._id}>
                            <Card sx={{ height: "100%" }}>
                                <CardHeader
                                    title={event.event_name}
                                    action={
                                        event.organizer === user._id && (
                                            <>
                                                <IconButton aria-label="settings">
                                                    <HighlightOffIcon onClick={(e) => handleDeleteEvent(event._id)} />
                                                </IconButton>

                                                {/* <Menu
                                                    anchorEl={anchorEl}
                                                    open={Boolean(anchorEl) && menuEventId === event._id}
                                                    onClose={handleMenuClose}
                                                >
                                                    <MenuItem onClick={() => handleUpdateEvent(event._id)}>
                                                        Update
                                                    </MenuItem>
                                                    <MenuItem onClick={() => handleDeleteEvent(event._id)}>
                                                        Delete
                                                    </MenuItem>
                                                </Menu> */}
                                            </>
                                        )
                                    }
                                    subheader={
                                        <>
                                            {event.event_date} - {event.event_time}
                                            <br />
                                            {event.location.place_name}
                                        </>
                                    }
                                />

                                <CardMedia
                                    component="img"
                                    height="140"
                                    src={`${base_api_url}/event/image/${event.image}`}
                                    alt={`${base_api_url}/event/image/${event.image}`}
                                />
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        {event.description}
                                    </Typography>
                                </CardContent>
                                {user._id && (
                                    <CardActions>
                                        {event.attendees.includes(user._id) ? (
                                            <UnregisterButton event_id={event._id} />
                                        ) : (
                                            <RegisterButton event_id={event._id} />
                                        )}
                                    </CardActions>
                                )}
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Container>
    );
};

export default ResponsiveGrid;
