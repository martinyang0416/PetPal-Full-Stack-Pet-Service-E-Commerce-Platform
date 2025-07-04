// App.js
import "./App.css";
import LoginSignup from "./pages/LoginSignup/LoginSignup";
import HomePage from "./pages/HomePage";
import ServiceBoardPage from "./pages/ServiceBoard/ServiceBoardPage";
import ServiceRequestOfferCreationPage from "./pages/ServiceBoard/ServiceRequestOfferCreationPage";
import Layout from "./components/Layout";
import PetMarketplace from "./pages/PetMarketplace/PetMarketplace";
import PetDetail from "./pages/PetMarketplace/PetDetail";
import UserProfile from "./pages/Profile/UserProfile";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import NewUserForm from "./pages/LoginSignup/NewUserForm";
import ProfileManagement from "./pages/Profile/ProfileManagement";
import EditProfile from "./pages/Profile/EditProfile";
import EventHub from "./pages/EventHub/EventHub";
// Import vet service components
import RoleSelection from "./pages/VetService/RoleSelection";
import VetList from "./pages/VetService/VetList";
import VetSchedule from "./pages/VetService/VetSchedule";
import Booking from "./pages/VetService/Booking";
import MyBookings from "./pages/VetService/MyBookings";
import VetDashboard from "./pages/VetService/VetDashboard";
import VetServiceManagement from "./pages/VetService/VetServiceManagement";
import ServiceFilterResultPage from "./pages/ServiceBoard/ServiceFilterResultPage";
import VetProfileForm from "./pages/VetService/VetProfileForm";
import VetDetails from "./pages/VetService/VetDetails";
import socketService from "./api/socketService";

function App() {
    return (
          
        <Router>
            <Routes>
                {/* Root path should redirect to auth */}
                <Route path="/" element={<Navigate to="/auth" replace />} />

                {/* Auth page does not have app bar */}
                <Route path="/auth" element={<LoginSignup />} />

                {/* Other pages has app bar and follow the */}
                <Route path="/" element={<Layout />}>
                    <Route path="home" element={<HomePage />} />
                    <Route path="service_board" element={<ServiceBoardPage />} />
                    <Route path="service_creation" element={<ServiceRequestOfferCreationPage />} />
                    <Route path="service_filtered" element={<ServiceFilterResultPage />} />
                    <Route path="new-user-form" element={<NewUserForm/>} />
                    <Route path="profile" element={<ProfileManagement/>} />
                    <Route path="edit-profile" element={<EditProfile/>} />
                    <Route path="eventhub" element={<EventHub />} />
                    <Route path="user/:username" element={<UserProfile />} />

                    {/* Vet Service Tracking System Routes */}
                    <Route path="vet-service-role" element={<RoleSelection />} />
                    <Route path="vet-profile-form" element={<VetProfileForm />} />

                    {/* Pet Owner Routes */}
                    <Route path="vet-list" element={<VetList />} />
                    <Route path="vet-details/:id" element={<VetDetails />} />
                    <Route path="vet-schedule/:id" element={<VetSchedule />} />
                    <Route path="booking/:id" element={<Booking />} />
                    <Route path="my-bookings" element={<MyBookings />} />

                    {/* Vet Routes */}
                    <Route path="vet-dashboard" element={<VetDashboard />} />
                    <Route path="vet-service/:id" element={<VetServiceManagement />} />
                    <Route path="market_place" element={<PetMarketplace />} />
                    <Route path="/market_place/:id" element={<PetDetail />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
