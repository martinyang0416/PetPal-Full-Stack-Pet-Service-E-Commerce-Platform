// AppBar.jsx

import { useState, useEffect } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import {
    AppBar,
    Toolbar, // Add Toolbar
    IconButton,
    Typography,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon, // Add ListItemIcon
    ListItemText,
    Avatar, // Add Avatar
} from "@mui/material";

import {
    Menu as MenuIcon,
    Home as HomeIcon,
    Festival as FestivalIcon,
    FormatListBulletedAdd as FormatListBulletedAddIcon,
    Person as ProfileIcon,
    Dashboard as DashboardIcon,
    Settings as SettingsIcon,
    ContactPage as ContactPageIcon,
    ShoppingCart as ShoppingCartIcon,
    Logout as LogoutIcon,
    FestivalOutlined as FestivalOutlinedIcon,
    Pets as PetsIcon,
    MedicalServices as MedicalIcon,
    EventNote as CalendarIcon,
} from "@mui/icons-material";

import { logoutUser, getCurrentUser } from "../api/auth";
import NotificationBadge from "./NotificationBadge";

const MyAppBar = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [user, setUser] = useState({ user_name: "Guest User" });

    // get user data
    useEffect(() => {
        // Get user data from localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
            } catch (error) {
                console.error("Error parsing user data from localStorage:", error);
                // Initialize with a default user
                const defaultUser = { user_name: "Guest User" };
                localStorage.setItem("user", JSON.stringify(defaultUser));
                setUser(defaultUser);
            }
        } else {
            // Create a default user if none exists
            const defaultUser = { user_name: "Guest User" };
            localStorage.setItem("user", JSON.stringify(defaultUser));
            setUser(defaultUser);
        }
    }, []);

    const navigate = useNavigate();

    // Fetch the current user when the component mounts
    // If not, redirect them to the login page.
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
            } catch (error) {
                console.error("Error fetching user data:", error);
                // alert("Failed to fetch user data. Try logging in again.");
                navigate("/auth");
            }
        };

        fetchUser();
    }, []);

    // Base navigation items that everyone sees
    const baseNavItems = [
        { name: "Home", path: "/home", icon: <HomeIcon /> },
        { name: "Profile", path: "/profile", icon: <ContactPageIcon /> },
        { name: "Service Board", path: "/service_board", icon: <FormatListBulletedAddIcon /> },
        { name: "Market Place", path: "/market_place", icon: <ShoppingCartIcon /> },
        { name: "Event Hub", path: "/eventhub", icon: <FestivalIcon /> },
    ];

    // Vet service navigation items based on user role
    const getVetServiceItems = () => {
        // If user has no identity yet, show role selection
        if (!user?.identity) {
            return [{ name: "Vet Services", path: "/vet-service-role", icon: <MedicalIcon /> }];
        }

        // If user is a vet, show vet dashboard
        if (user.identity === "vet" || (Array.isArray(user.identity) && user.identity.includes("vet"))) {
            return [{ name: "Vet Dashboard", path: "/vet-dashboard", icon: <DashboardIcon /> }];
        }

        // If user is a pet owner, show pet owner options
        if (user.identity === "pet_owner" || (Array.isArray(user.identity) && user.identity.includes("pet_owner"))) {
            return [
                { name: "Find Vets", path: "/vet-list", icon: <MedicalIcon /> },
                { name: "My Vet Appointments", path: "/my-bookings", icon: <CalendarIcon /> },
            ];
        }

        // Default case
        return [{ name: "Vet Services", path: "/vet-service-role", icon: <MedicalIcon /> }];
    };

    // Logout option that everyone sees
    const logoutItem = {
        name: "Logout",
        icon: <LogoutIcon />,
        action: async (navigate, setDrawerOpen) => {
            try {
                // For development: Just clear localStorage
                localStorage.removeItem("user");
                // In production: await logoutUser();
                alert("You've been logged out.");
                navigate("/auth");
            } catch (err) {
                console.error("Logout failed:", err);
                alert("Logout error.");
            } finally {
                setDrawerOpen(false);
            }
        },
    };

    // Combine all navigation items
    const navList = [...baseNavItems, ...getVetServiceItems(), logoutItem];

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleNavClick = async (item) => {
        if (item.action) {
            await item.action(navigate, setDrawerOpen);
        } else {
            navigate(item.path);
            setDrawerOpen(false);
        }
    };

    // Drawer component
    const drawer = (
        <Box role="presentation" sx={{ width: 300 }}>
            <List>
                {navList.map((item) => (
                    <ListItem button key={item.name} onClick={() => handleNavClick(item)}>
                        <ListItemText primary={item.name} />
                        <ListItemIcon> {item.icon} </ListItemIcon>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ width: "100%" }}>
            <AppBar position="static">
                <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={handleDrawerToggle}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <NotificationBadge />
                        {user && <Avatar>{user.user_name.charAt(0).toUpperCase()}</Avatar>}
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
                {drawer}
            </Drawer>
        </Box>
    );
};

export default MyAppBar;
