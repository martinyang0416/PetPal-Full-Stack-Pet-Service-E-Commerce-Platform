import React, { useState, useEffect } from "react";
import {
    FormControl,
    Paper,
    InputBase,
    IconButton,
    Divider,
    Button,
    Box,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";
import { getCurrentUser } from "../../api/auth";

// This is the base class for search strategies
// It defines the interface for all search strategies
class SearchStategy {
    search(eventList) {
        throw new Error("search method not implemented");
    }

    inputField(triggerSearch) {
        throw new Error("inputField component not implemented");
    }
}

class NameSearchStrategy extends SearchStategy {
    constructor() {
        super();
        this.query = "";
        this.name = "Name";
        this.inputId = "name-search-input";
    }

    search(eventList) {
        this.query = document.getElementById(this.inputId).value;

        if (!this.query || this.query.length === 0) {
            console.log("No query");
            return eventList.map((event) => ({ ...event, display: true }));
        }

        const filteredEvents = eventList.map((event) => {
            const eventName = event.event_name.toLowerCase();
            const query = this.query.toLowerCase();
            return eventName.includes(query) ? { ...event, display: true } : { ...event, display: false };
        });

        return filteredEvents;
    }

    inputField(triggerSearch) {
        return (
            <TextField
                id={this.inputId}
                sx={{ width: "100%" }}
                label="Search Keyword"
                variant="outlined"
                onChange={(e) => {
                    this.query = e.target.value;
                    console.log(this.query, this.query.length);
                    // call the search function
                    triggerSearch();
                }}
            />
        );
    }
}

class DateSearchStrategy extends SearchStategy {
    constructor() {
        super();
        this.startDate = "";
        this.endDate = "";
        this.name = "Date";
        this.startDateId = "start-date-search-input";
        this.endDateId = "end-date-search-input";
    }

    search(eventList) {
        this.startDate = document.getElementById(this.startDateId).value;
        this.endDate = document.getElementById(this.endDateId).value;

        console.log("Date search strategy", this.startDate, this.endDate);
        if (!this.startDate || !this.endDate) {
            return eventList.map((event) => ({ ...event, display: true }));
        }

        return eventList.map((event) => {
            const startDate = new Date(this.startDate);
            const endDate = new Date(this.endDate);
            const eventDate = new Date(event.event_date);
            const inRange = eventDate >= startDate && eventDate <= endDate;
            return { ...event, display: inRange };
        });
    }

    inputField(triggerSearch) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    width: "100%",
                }}
            >
                <TextField
                    id={this.startDateId}
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    label="Start Date"
                    onChange={(e) => {
                        this.startDate = e.target.value;
                        triggerSearch();
                    }}
                />
                <TextField
                    id={this.endDateId}
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    label="End Date"
                    onChange={(e) => {
                        this.endDate = e.target.value;
                        triggerSearch();
                    }}
                />
            </Box>
        );
    }
}

class TimeSearchStrategy extends SearchStategy {
    constructor() {
        super();
        this.startTime = "";
        this.endTime = "";
        this.name = "Time";
        this.startTimeId = "start-time-search-input";
        this.endTimeId = "end-time-search-input";
    }

    search(eventList) {
        this.startTime = document.getElementById(this.startTimeId).value;
        this.endTime = document.getElementById(this.endTimeId).value;

        console.log("Time search strategy", this.startTime, this.endTime);
        if (!this.startTime || !this.endTime) {
            return eventList.map((event) => ({ ...event, display: true }));
        }
        return eventList.map((event) => {
            const eventTime = new Date(`1970-01-01T${event.event_time}:00`);
            const startTime = new Date(`1970-01-01T${this.startTime}:00`);
            const endTime = new Date(`1970-01-01T${this.endTime}:00`);
            return { ...event, display: eventTime >= startTime && eventTime <= endTime };
        });
    }

    inputField(triggerSearch) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    width: "100%",
                }}
            >
                <TextField
                    id={this.startTimeId}
                    fullWidth
                    type="time"
                    InputLabelProps={{ shrink: true }}
                    label="Start Time"
                    onChange={(e) => {
                        this.startTime = e.target.value;
                        triggerSearch();
                    }}
                />
                <TextField
                    id={this.endTimeId}
                    fullWidth
                    type="time"
                    InputLabelProps={{ shrink: true }}
                    label="End Time"
                    onChange={(e) => {
                        this.endTime = e.target.value;
                        triggerSearch();
                    }}
                />
            </Box>
        );
    }
}

class AttendanceSearchStrategy extends SearchStategy {
    constructor(currentUser) {
        super();
        this.name = "Attendance";
        this.currentUser = currentUser;
    }

    search(eventList) {
        console.log("Attendance search strategy", this.currentUser._id);

        return eventList.map((event) => {
            return { ...event, display: event.attendees.includes(this.currentUser._id) };
        });
    }

    inputField(triggerSearch) {
        return (
            <Typography
                align="center"
                variant="body1"
                sx={{
                    width: "100%",
                    padding: "14px",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    borderRadius: "4px",
                    fontStyle: "italic",
                    color: "text.secondary",
                }}
            >
                Showing events you are attending
            </Typography>
        );
    }
}

// The search bar component
const SearchBar = ({ handleNewEventDialogOpen, eventList, setEventList, currentUser }) => {
    const strategyMap = {
        name: new NameSearchStrategy(),
        date: new DateSearchStrategy(),
        time: new TimeSearchStrategy(),
        attendance: new AttendanceSearchStrategy(currentUser),
    };

    const [strategyKey, setStrategyKey] = React.useState("name");
    const searchStrategy = strategyMap[strategyKey];

    const triggerSearch = () => {
        const result = searchStrategy.search(eventList);
        if (JSON.stringify(result) !== JSON.stringify(eventList)) {
            setEventList(result);
        }
    };

    useEffect(() => {
        triggerSearch(); // Automatically run search whenever strategyKey changes
        console.log("Event list updated:", eventList);
    }, [strategyKey, eventList]);

    return (
        <Paper
            component="form"
            sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "stretch",
                gap: 1,
                padding: 2,
                margin: 3,
                flexWrap: "wrap",
            }}
        >
            <FormControl>
                <InputLabel id="select-label">Search Method</InputLabel>
                <Select
                    labelId="select-label"
                    id="demo-simple-select"
                    value={strategyKey}
                    label="Search Method"
                    onChange={(e) => {
                        setStrategyKey(e.target.value);
                        // triggerSearch(); //how to trigger search after the strategy is changed not before?
                    }}
                >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="time">Time</MenuItem>
                    <MenuItem value="attendance">Attending</MenuItem>
                </Select>
            </FormControl>

            <Box sx={{ flex: 1 }}>{searchStrategy.inputField(triggerSearch)}</Box>

            <Divider orientation="vertical" flexItem sx={{ margin: 2, display: { xs: "none", sm: "block" } }} />

            <Button
                variant="contained"
                color="primary"
                sx={{ alignSelf: { xs: "center", sm: "auto" }, width: { xs: "100%", sm: "auto" } }}
                onClick={handleNewEventDialogOpen}
            >
                Add New
            </Button>
        </Paper>
    );
};

export default SearchBar;
