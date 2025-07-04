import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import axios from 'axios';

// Configure axios to use the correct base URL
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Add a request interceptor to include token in headers
axios.interceptors.request.use(function (config) {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
        // Add token to Authorization header
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
