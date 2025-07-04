// Layout.jsx
import { Outlet } from "react-router-dom";
import MyAppBar from "./AppBar";

/**
 * Layout component that wraps around the main content of the application.
 * It includes the AppBar and a main content area.
 */

const Layout = () => {
    return (
        <div
            className="layout"
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                minHeight: "100vh",
            }}
        >
            <MyAppBar />
            <main
                style={{
                    flex: 1,
                }}
            >
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
