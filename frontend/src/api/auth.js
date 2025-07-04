const BASE_URL = "http://localhost:5000/api";

export const signupUser = async (userData) => {
    const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
    });
    return res.json();
};

export const loginUser = async (userData) => {
    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
    });
    
    const data = await res.json();
    
    if (data.msg === "Login successful!") {
        // Get the user data after successful login
        try {
            const userResponse = await fetch(`${BASE_URL}/me`, {
                method: "GET",
                credentials: "include",
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Extract token from cookies if available
                const cookies = document.cookie.split(';');
                const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token_cookie='));
                if (tokenCookie) {
                    const token = tokenCookie.split('=')[1];
                    localStorage.setItem('token', token);
                }
            }
        } catch (error) {
            console.error("Error fetching user data after login:", error);
        }
    }
    
    return data;
};

export const logoutUser = async () => {
    const res = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Failed to log out.");
    }
    
    // Clear localStorage on logout
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    return res.json();
};

export const getCurrentUser = async () => {
    const res = await fetch(`${BASE_URL}/me`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Failed to fetch current user.");
    }
    
    const userData = await res.json();
    
    // Update the stored user data
    localStorage.setItem('user', JSON.stringify(userData));
    
    return userData;
};

