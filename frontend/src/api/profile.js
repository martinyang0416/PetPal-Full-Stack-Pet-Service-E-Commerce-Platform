const BASE_URL = "http://localhost:5000/api"; 

export const completeUserProfile = async (formData) => {
    const res = await fetch(`${BASE_URL}/complete_profile`, {
      method: "POST",  
      credentials: "include", 
      body: formData,
    });
  
    if (!res.ok) {
      throw new Error("Failed to complete profile.");
    }
  
    return res.json();
  };
  
  export const fetchProfile = async () => {
    const res = await fetch(`${BASE_URL}/me`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  };
  
  export const fetchPets = async () => {
    const res = await fetch(`${BASE_URL}/pets`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch pets");
    return res.json();
  };
  
  export const createPet = async (petData, petPic) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(petData));
    if (petPic) formData.append("profile_picture", petPic);
  
    const res = await fetch(`${BASE_URL}/create_pet`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  
    if (!res.ok) throw new Error("Failed to create pet");
  };
  
  export const deletePet = async (petId) => {
    const res = await fetch(`${BASE_URL}/delete_pet/${petId}`, {
      method: "DELETE",
      credentials: "include",
    });
  
    if (!res.ok) throw new Error("Failed to delete pet");
  };

  export const getProfilePictureUrl = (filename) => {
    return filename ? `${BASE_URL}/profile_picture/${filename}` : null;
  };
  

  export const updatePet = async (petId, petData, petPic) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(petData));
    if (petPic) formData.append("profile_picture", petPic);
  
    const res = await fetch(`${BASE_URL}/update_pet/${petId}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });
  
    if (!res.ok) throw new Error("Failed to update pet");
  };
  
  export const searchUsers = async (query) => {
    const res = await fetch(`${BASE_URL}/search_users?q=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    });
    
    if (!res.ok) throw new Error("Failed to search users");
    return res.json();
  };
  
  export const followUser = async (username) => {
    if (!username) throw new Error("Username is required");
    
    try {
        const res = await fetch(`${BASE_URL}/follow/${username}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || "Failed to follow user");
        }

        return {
            ...data,
            is_following: true  // User is immediately following after request
        };
    } catch (err) {
        console.error('Error following user:', err);
        throw new Error(err.message || "Failed to follow user");
    }
  };
  
  export const unfollowUser = async (username) => {
    if (!username) throw new Error("Username is required");
    
    const res = await fetch(`${BASE_URL}/unfollow/${username}`, {
      method: "POST",
      credentials: "include",
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to unfollow user");
    }
    return res.json();
  };
  
  export const getFollowStats = async () => {
    const res = await fetch(`${BASE_URL}/me`, {
      method: "GET",
      credentials: "include",
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch user info");
    }

    const userInfo = await res.json();
    const username = userInfo.user_name;

    // Get follower and following counts directly from profile
    return {
      followersCount: userInfo.followers_count || 0,
      followingCount: userInfo.following_count || 0
    };
  };
  
  export const getFollowers = async (username) => {
    if (!username) throw new Error("Username is required");
    
    const res = await fetch(`${BASE_URL}/followers/${username}`, {
      method: "GET",
      credentials: "include",
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch followers");
    }
    return res.json();
  };
  
  export const getFollowing = async (username) => {
    if (!username) throw new Error("Username is required");
    
    const res = await fetch(`${BASE_URL}/following/${username}`, {
      method: "GET",
      credentials: "include",
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch following users");
    }
    return res.json();
  };
  
  export const getUserProfile = async (username) => {
    if (!username) throw new Error("Username is required");
    
    try {
        const res = await fetch(`${BASE_URL}/profile/${username}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });
        
        let data;
        try {
            data = await res.json();
        } catch (err) {
            throw new Error("Failed to parse profile data");
        }
        
        if (!res.ok) {
            throw new Error(data.error || "Failed to fetch user profile");
        }
        
        return {
            ...data,
            is_private: data.is_private || false,
            has_pending_request: data.has_pending_request || false,
            is_following: data.is_following || false,
            followers_count: data.followers_count || 0,
            following_count: data.following_count || 0
        };
    } catch (err) {
        if (err.message.includes("Authentication required")) {
            throw new Error("Please log in to view this profile");
        }
        if (err.message === "Failed to parse profile data") {
            throw new Error("Failed to load profile. Please try again later.");
        }
        throw new Error(err.message || "Failed to load profile");
    }
  };
  
  export const rateUser = async (username, rating, comment) => {
    if (!username) throw new Error("Username is required");
    if (!rating) throw new Error("Rating is required");
    
    try {
        const res = await fetch(`${BASE_URL}/rate/${username}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ rating, comment }),
        });
        
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            throw new Error("Authentication required. Please log in again.");
        }
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to submit rating");
        }
        
        return res.json();
    } catch (err) {
        if (err.message.includes("Authentication required")) {
            throw new Error("Please log in to submit a rating");
        }
        // Handle CORS errors
        if (err.name === "TypeError" && err.message.includes("Failed to fetch")) {
            throw new Error("Network error. Please try again later.");
        }
        throw err;
    }
  };
  
  export const getUserReviews = async (username) => {
    if (!username) throw new Error("Username is required");
    
    try {
        const res = await fetch(`${BASE_URL}/reviews/${username}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });
        
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            throw new Error("Authentication required. Please log in again.");
        }
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to fetch reviews");
        }
        
        return res.json();
    } catch (err) {
        if (err.message.includes("Authentication required")) {
            throw new Error("Please log in to view reviews");
        }
        throw err;
    }
  };
  
  export const getUserPets = async (username) => {
    try {
        const response = await fetch(`${BASE_URL}/user/${username}/pets`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user pets');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user pets:', error);
        throw error;
    }
  };
  
  export const getNotifications = async () => {
    const response = await fetch(`${BASE_URL}/notifications`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  };
  