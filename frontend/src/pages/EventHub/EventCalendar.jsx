import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Drawer, Button, IconButton, Box, Typography } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";

const EventCalendar = ({ eventList }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const toggleDrawer = () => {
        setDrawerOpen((prev) => !prev);
    };

    const formattedEvents = eventList
        .filter((e) => e.display !== false)
        .map((event) => ({
            title: event.event_name,
            date: event.event_date,
        }));

    return (
        <div>
            <Button
                variant="contained"
                startIcon={<CalendarMonthIcon />}
                onClick={toggleDrawer}
                sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 1300, // higher than most elements, but below drawer
                    boxShadow: 3,
                    borderRadius: "999px",
                    paddingX: 2,
                    paddingY: 1,
                }}
            >
                Calendar View
            </Button>

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer}
                PaperProps={{ sx: { width: "80vw", padding: 2 } }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Event Calendar</Typography>
                    <IconButton onClick={toggleDrawer}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        height="auto"
                        events={formattedEvents}
                    />
                </Box>
            </Drawer>
        </div>
    );
};

export default EventCalendar;
