import React, { useEffect, useState } from "react";
import { getCurrentUser } from "../api/auth";

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
        setUser(data);
      } catch (err) {
        console.error("❌ Error fetching user:", err);
        setError("Could not fetch user info.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
      <h1>Home Page</h1>

      {loading && <p>Loading user info...</p>}

      {!loading && user && (
        <p>Welcome back, <strong>{user.user_name}</strong>!</p>
      )}

      {!loading && error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default HomePage;
