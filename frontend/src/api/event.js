// event.js
// Event API functions

// Post an event to the server.
const BASE_URL = process.env.REACT_APP_BASE_URL;
console.log("BASE_URL", BASE_URL);

// CSRF token for security
const getCookie = (name) => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : null;
};

// Post an event to the server.
async function postEvent({ name, description, date, time, location, image }) {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("date", date);
    formData.append("time", time);
    formData.append("location", JSON.stringify(location)); // assuming location is an object
    formData.append("image", image); // a file object

    for (const value of formData.values()) {
        console.log(value);
    }

    const res = await fetch(`${BASE_URL}/event/`, {
        method: "POST",
        headers: {
            "X-CSRF-Token": getCookie("csrf_access_token"), // CSRF token for security
        },
        body: formData,
        credentials: "include", // include credentials for CORS
    });

    if (!res.ok) {
        console.error("Error posting event:", res.statusText);
        throw new Error("Failed to post event");
    }

    return res.json();
}

// Get all events from the server.
async function getAllEvents() {
    const res = await fetch(`${BASE_URL}/event`, {
        method: "GET",
        credentials: "include", // include credentials for CORS
    });

    if (!res.ok) {
        console.error("Error getting events:", res.statusText);
        throw new Error("Failed to get events");
    }

    const data = await res.json();

    return data;
}

async function deleteEvent(eventId) {
    const res = await fetch(`${BASE_URL}/event/${eventId}/`, {
        method: "DELETE",
        headers: {
            "X-CSRF-Token": getCookie("csrf_access_token"), // CSRF token for security
        },
        credentials: "include", // include credentials for CORS
    });

    const data = await res.json();

    if (!res.ok) {
        console.error("Error deleting event:", res.msg);
        alert("Failed to delete event");
    } else {
        alert("Event deleted successfully");
    }
}

async function toggleAttendance(eventId) {
    const res = await fetch(`${BASE_URL}/event/attendance/${eventId}/`, {
        method: "POST",
        headers: {
            "X-CSRF-Token": getCookie("csrf_access_token"), // CSRF token for security
        },
        credentials: "include", // include credentials for CORS
    });

    if (!res.ok) {
        console.error("Error toggling attendance:", res);
    }

    return res.json();
}

export { postEvent, getAllEvents, toggleAttendance, deleteEvent };
