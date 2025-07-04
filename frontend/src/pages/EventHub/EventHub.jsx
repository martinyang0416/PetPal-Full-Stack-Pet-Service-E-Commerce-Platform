// EventHub.jsx
import React, { useEffect } from "react";
import { useState } from "react";
import { Pets as PetsIcon } from "@mui/icons-material";
import NewEventDiaglog from "./NewEventDialog";
import SearchIcon from "@mui/icons-material/Search";
import { getAllEvents } from "../../api/event";
import AddBoxIcon from "@mui/icons-material/AddBox";
import SearchBar from "./SearchBar";
import ResponsiveGrid from "./ResponsiveGrid";
import { getCurrentUser } from "../../api/auth";
import socketService from "../../api/socketService";
import EventCalendar from "./EventCalendar";

const EventHub = () => {
    const [newEventDialogOpen, setNewEventDialogOpen] = useState(false);
    const [eventList, setEventList] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const handleNewEventDialogOpen = () => {
        setNewEventDialogOpen(!newEventDialogOpen);
    };

    // fetch the current user when the component mounts
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getCurrentUser();
                setCurrentUser(userData);
            } catch (error) {
                console.error("Error fetching user data in ResponsiveGrid:", error);
                alert("Failed to fetch user data. Try logging in again.");
            }
        };

        fetchUser();
    }, []);

    // fetch all events when the component mounts
    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getAllEvents();
                setEventList(data.map((event) => ({ ...event, display: true })));
                console.log("Event data from server:", data);
            } catch (error) {
                console.error("Error fetching events:", error);
            }
        }

        fetchData();
    }, []);

    // socket connection
    useEffect(() => {
        socketService.on("new_event", (newEvent) => {
            console.log("Socket: New event created:", newEvent);
            setEventList((prevEvents) => [...prevEvents, newEvent]);
        });

        socketService.on("event_updated", (updatedEvent) => {
            console.log("Socket: Event updated:", updatedEvent);
            setEventList((prevEvents) =>
                prevEvents.map((event) => (event._id === updatedEvent._id ? updatedEvent : event))
            );
        });

        socketService.on("event_deleted", (deletedEventId) => {
            console.log("Socket: Event deleted:", deletedEventId);
            setEventList((prevEvents) => prevEvents.filter((event) => event._id !== deletedEventId));
        });

        return () => {
            socketService.disconnect();
        };
    }, []);

    if (!currentUser) {
        return <div>Loading user...</div>;
    }

    return (
        <div>
            <SearchBar
                handleNewEventDialogOpen={handleNewEventDialogOpen}
                eventList={eventList}
                setEventList={setEventList}
                currentUser={currentUser} // Placeholder for current user
            />
            <EventCalendar eventList={eventList} user={currentUser} />
            <ResponsiveGrid eventList={eventList} user={currentUser} />
            <NewEventDiaglog open={newEventDialogOpen} onClose={handleNewEventDialogOpen} />
        </div>
    );
};

export default EventHub;
