// src/services/socketService.js
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect() {
        if (this.socket) return;

        // Connect to the Socket.IO server
        this.socket = io(SOCKET_URL, {
            withCredentials: true, // Important for cookie-based authentication
        });

        this.socket.on("connect", () => {
            console.log("Connected to socket server");
            this.connected = true;
        });

        this.socket.on("disconnect", () => {
            console.log("Disconnected from socket server");
            this.connected = false;
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    // Send a message to the server
    // Should not be used in principal
    sendMessage(event, data) {
        if (this.socket && this.connected) {
            this.socket.emit(event, data);
        } else {
            console.error("Socket not connected");
        }
    }

    // Subscribe to an event
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        } else {
            this.connect();
            this.socket.on(event, callback);
        }
    }
}

// Create a singleton instance
const socketService = new SocketService();
socketService.connect();

export default socketService;
