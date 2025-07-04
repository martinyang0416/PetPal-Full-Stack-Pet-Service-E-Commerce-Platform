import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileManagement.css";
import defaultAvatar from '../../Assets/user.png';
import {
  fetchProfile,
  fetchPets,
  createPet,
  deletePet,
  getProfilePictureUrl,
  updatePet,
  searchUsers,
  followUser,
  unfollowUser,
  getFollowStats,
  getFollowers,
  getFollowing
} from "../../api/profile";

const ProfileManagement = () => {
  const [profile, setProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({});
  const [showPetModal, setShowPetModal] = useState(false);
  const [newPet, setNewPet] = useState(null);
  const [newPetPic, setNewPetPic] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [followStats, setFollowStats] = useState({ followersCount: "--", followingCount: "--" });
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');
  const [followModalUsers, setFollowModalUsers] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profile and pets first
        const [profileData, petsData] = await Promise.all([
          fetchProfile(),
          fetchPets(),
        ]);
        setProfile(profileData);
        setPets(petsData);
  
        // Load follow stats separately to not block profile loading
        try {
          const [followers, following] = await Promise.all([
            getFollowers(profileData.user_name),
            getFollowing(profileData.user_name),
          ]);
          setFollowStats({
            followersCount: followers.length,
            followingCount: following.length,
          });
        } catch (err) {
          console.error("Error loading follow stats:", err);
          setFollowStats({ followersCount: 0, followingCount: 0 });
        }
        
  
        if (typeof profileData?.profile_completion === "number" && profileData.profile_completion < 60) {
          setShowCompletionPopup(true);
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
  
    loadData();
  }, []);
  

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCreatePet = () => {
    setNewPet(null); 
    setNewPetPic(null);
    setShowPetModal(true);
  };

  const submitNewPet = async () => {
    try {
      if (newPet?._id) {
        await updatePet(newPet._id, newPet, newPetPic);
      } else {
        await createPet(newPet, newPetPic);
      }
      setShowPetModal(false);
      window.location.reload();
    } catch (err) {
      console.error("Error saving pet:", err);
      alert("Failed to save pet.");
    }
  };
  

  const handleSearch = async (query) => {
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchResults([]);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const handleUserClick = (user) => {
    navigate(`/user/${user.user_name}`);
  };

  const handleFollowToggle = async () => {
    if (!selectedUser || isFollowLoading) return;
    
    setIsFollowLoading(true);
    setError(null);
    
    try {
      if (isFollowing) {
        await unfollowUser(selectedUser.user_name);
        setIsFollowing(false);
        // Decrease following count
        setFollowStats(prev => ({
          ...prev,
          followingCount: Math.max(0, prev.followingCount - 1)
        }));
      } else {
        await followUser(selectedUser.user_name);
        setIsFollowing(true);
        // Increase following count
        setFollowStats(prev => ({
          ...prev,
          followingCount: prev.followingCount + 1
        }));
      }
    } catch (err) {
      console.error("Error toggling follow status:", err);
      setError(err.message);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShowFollows = async (type) => {
    setFollowModalType(type);
    setShowFollowModal(true);
    try {
      // Get the current user's username from the profile
      if (!profile?.user_name) {
        throw new Error("User information not available");
      }

      const users = type === 'followers' 
        ? await getFollowers(profile.user_name)
        : await getFollowing(profile.user_name);
      
      setFollowModalUsers(users);
      
      // Update follow stats based on the number of users
      setFollowStats(prev => ({
        ...prev,
        [type === 'followers' ? 'followersCount' : 'followingCount']: users.length
      }));
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(err.message);
    }
  };

  if (loading) return <div className="loading-spinner">Loading profile...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!profile) return <div className="error-message">Profile not found or error occurred.</div>;

  const isServiceProvider = profile.identity?.includes("service_provider");
  const isPetOwner = profile.identity?.includes("pet_owner");

  return (
    <div className="profile-page-container">
      <div className="profile-main-content">
        <div className="profile-container">
          <img
            className="profile-picture"
            src={getProfilePictureUrl(profile.profile_picture) || defaultAvatar}
            alt="Profile"
          />
          <div className="profile-name-row">
            <div className="profile-name">{profile.name?.trim() || "Anonymous"}</div>
            <button className="edit-button-inline" onClick={() => navigate("/edit-profile")}>✎ Edit</button>
          </div>

          <div className="profile-location">
            {`${profile.location?.city || ""}, ${profile.location?.state || ""}, ${profile.location?.country || ""}`.replace(/^, |, ,/g, "")}
          </div>

          <div className="follow-stats">
            <button 
              className="follow-stat-button" 
              onClick={() => handleShowFollows('followers')}
            >
              <span className="follow-count">{followStats.followersCount}</span>
              <span className="follow-label">Followers</span>
            </button>
            <button 
              className="follow-stat-button" 
              onClick={() => handleShowFollows('following')}
            >
              <span className="follow-count">{followStats.followingCount}</span>
              <span className="follow-label">Following</span>
            </button>
          </div>

          {profile.identity?.length > 0 && (
            <div className="profile-identity">
              {profile.identity.map((role) => (
                <span className="identity-tag" key={role}>
                  {role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          )}

          <div className="profile-bio">{profile.bio?.trim() || "No bio provided."}</div>

          <div className={`accordion ${openSections.contact ? "active" : ""}`}>
            <div className="accordion-header" onClick={() => toggleSection("contact")}>Contact</div>
            <div className="accordion-body">
              <p>Email: {profile.contact?.email}</p>
              <p>Phone: {profile.contact?.phone_number}</p>
            </div>
          </div>

          {isServiceProvider && (
            <>
              <div className={`accordion ${openSections.availability ? "active" : ""}`}>
                <div className="accordion-header" onClick={() => toggleSection("availability")}>Service Availability</div>
                <div className="accordion-body">
                  <ul>
                    {Object.entries(profile.availability || {}).map(([slot, available]) =>
                      available ? <li key={slot}>{slot}</li> : null
                    )}
                  </ul>
                </div>
              </div>

              <div className={`accordion ${openSections.review ? "active" : ""}`}>
                <div className="accordion-header" onClick={() => toggleSection("review")}>Reviews</div>
                <div className="accordion-body">
                  <div className="rating-display">
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${star <= (profile.rating || 0) ? 'selected' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="rating-text">{profile.rating ? `${profile.rating.toFixed(1)} / 5` : 'No ratings yet'}</p>
                    <p className="total-reviews">({profile.review?.length || 0} {profile.review?.length === 1 ? 'review' : 'reviews'})</p>
                  </div>
                  {(profile.review && profile.review.length > 0) ? (
                    <div className="reviews-list">
                      {profile.review.map((review, idx) => (
                        <div key={idx} className="review-item">
                          <div className="review-header">
                            <div className="review-rating">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`star ${star <= review.rating ? 'selected' : ''}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <div className="review-date">
                              {new Date(review.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="review-comment">{review.comment || 'No comment provided'}</div>
                          <div className="review-reviewer">By: {review.reviewer}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-reviews-message">No reviews yet</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className={`accordion ${openSections.preference ? "active" : ""}`}>
            <div className="accordion-header" onClick={() => toggleSection("preference")}>Preferences</div>
            <div className="accordion-body">
              <p><strong>Hobbies:</strong> {profile.preference?.hobbies?.join(", ") || "None"}</p>
              <p><strong>Work:</strong> {profile.preference?.work?.join(", ") || "None"}</p>
            </div>
          </div>

          {isPetOwner && (
            <div className={`accordion ${openSections.pets ? "active" : ""}`}>
              <div className="accordion-header" onClick={() => toggleSection("pets")}>Pets</div>
              <div className="accordion-body">
                <div className="pet-list-scroll">
                  {pets.map((pet) => (
                    <div
                      className="pet-item"
                      key={pet._id}
                      onClick={() => setSelectedPet(pet)}
                    >
                      <div className="pet-circle">
                        {pet.profile_picture ? (
                          <img
                            src={getProfilePictureUrl(pet.profile_picture)}
                            alt="pet"
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                          />
                        ) : (
                          <span className="pet-initial">{pet.name?.charAt(0).toUpperCase() || "?"}</span>
                        )}
                      </div>
                      <div className="pet-name">{pet.name || "No name"}</div>
                    </div>
                  ))}

                  <div className="pet-item" onClick={handleCreatePet}>
                    <div className="pet-circle pet-add-circle">+</div>
                    <div className="pet-name">Add Pet</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPet && (
            <div className="modal-backdrop" onClick={() => setSelectedPet(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{selectedPet.name}</h3>
                <img
                  src={getProfilePictureUrl(selectedPet.profile_picture) || defaultAvatar}
                  alt="Pet"
                  className="pet-modal-img"
                />


                <p><strong>Type:</strong> {selectedPet.type}</p>
                <p><strong>Age:</strong> {selectedPet.age}</p>
                <p><strong>Weight:</strong> {selectedPet.weight} kg</p>
                <p><strong>Color:</strong> {selectedPet.color}</p>
                <p><strong>Description:</strong> {selectedPet.description}</p>

                <div className="modal-buttons">
                  <button
                    onClick={() => {
                      setNewPet(selectedPet);
                      setNewPetPic(null);
                      setShowPetModal(true);
                      setSelectedPet(null);
                    }}
                  >
                    ✎ Edit
                  </button>
                  <button
                    onClick={async () => {
                      const confirmDelete = window.confirm("Are you sure you want to delete this pet?");
                      if (!confirmDelete) return;

                      try {
                        await deletePet(selectedPet._id);
                        alert("Pet deleted!");
                        setSelectedPet(null);
                        window.location.reload();
                      } catch (err) {
                        console.error("Error deleting pet:", err);
                        alert("Failed to delete pet.");
                      }
                    }}
                    style={{ marginLeft: "1rem", backgroundColor: "#e74c3c", color: "white" }}
                  >
                    🗑 Delete
                  </button>
                  <button onClick={() => setSelectedPet(null)} style={{ marginLeft: "auto" }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPetModal && (
            <div className="modal-backdrop">
              <div className="modal">
                <h3>{newPet?._id ? "Edit Pet" : "Add New Pet"}</h3>

                <label>Pet Name</label>
                <input
                  type="text"
                  placeholder={newPet?.name || "Pet name"}
                  onChange={(e) => setNewPet((prev) => ({ ...prev, name: e.target.value }))}
                />

                <label>Pet Type</label>
                <input
                  type="text"
                  placeholder={newPet?.type || "Pet type"}
                  onChange={(e) => setNewPet((prev) => ({ ...prev, type: e.target.value }))}
                />

                <label>Age</label>
                <input
                  type="number"
                  placeholder={newPet?.age || "Age"}
                  onChange={(e) => setNewPet((prev) => ({ ...prev, age: e.target.value }))}
                />

                <label>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={newPet?.weight || "Weight (kg)"}
                  onChange={(e) => setNewPet((prev) => ({ ...prev, weight: e.target.value }))}
                />

                <label>Color</label>
                <input
                  type="text"
                  placeholder={newPet?.color || "Color"}
                  onChange={(e) => setNewPet((prev) => ({ ...prev, color: e.target.value }))}
                />    

                <label>Description</label>
                <textarea
                  placeholder={newPet?.description || "Description"}
                  onChange={(e) => setNewPet((prev) => ({ ...prev, description: e.target.value }))}
                />

                <label>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPetPic(e.target.files[0])}
                />

                <div className="modal-buttons">
                  <button onClick={submitNewPet}>Save Changes</button>
                  <button className="cancel" onClick={() => setShowPetModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {showCompletionPopup && (
            <div className="modal-backdrop">
              <div className="modal" style={{ maxWidth: "320px", textAlign: "center" }}>
                <h3>👋 Welcome!</h3>
                <p>Your profile is <strong>{profile.profile_completion}%</strong> complete.</p>
                <p>Complete your profile to get better recommendations and visibility!</p>

                <div className="modal-buttons" style={{ marginTop: "1rem" }}>
                  <button onClick={() => navigate("/edit-profile")}>✎ Edit Profile</button>
                  <button className="cancel" onClick={() => setShowCompletionPopup(false)}>Close</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      
      <div className="profile-sidebar">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search users and press Enter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="search-input"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="search-result-users">
            <h3>Search Results</h3>
            <div className="search-result-users-list">
              {searchResults.map((user) => (
                <div 
                  key={user._id} 
                  className="search-result-user-card"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="search-result-user-avatar">
                    <img
                      src={getProfilePictureUrl(user.profile_picture) || defaultAvatar}
                      alt={user.name}
                    />
                  </div>
                  <div className="search-result-user-info">
                    <div className="search-result-user-name">{user.name}</div>
                    <div className="search-result-user-role">
                      {user.identity?.map(role => role.replace("_", " ")).join(", ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal user-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <img
                src={getProfilePictureUrl(selectedUser.profile_picture) || defaultAvatar}
                alt={selectedUser.name}
                className="modal-profile-picture"
              />
              <h3>{selectedUser.name}</h3>
              <div className="user-roles">
                {selectedUser.identity?.map(role => (
                  <span key={role} className="identity-tag">
                    {role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-content">
              <p className="user-location">
                {[
                  selectedUser.location?.city,
                  selectedUser.location?.state,
                  selectedUser.location?.country
                ].filter(Boolean).join(", ")}
              </p>
              {selectedUser.rating !== undefined && (
                <p className="user-rating">Rating: {selectedUser.rating} / 5</p>
              )}
            </div>

            <div className="modal-buttons">
              {error && (
                <div className="text-red-500 text-sm mt-2">
                  {error}
                </div>
              )}
              <button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className={`px-4 py-2 rounded ${
                  isFollowing ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white font-semibold transition-colors ${
                  isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              <button onClick={() => setSelectedUser(null)} className="close-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showFollowModal && (
        <div className="modal-backdrop" onClick={() => setShowFollowModal(false)}>
          <div className="modal user-list-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{followModalType === 'followers' ? 'Followers' : 'Following'}</h3>
            <div className="user-list">
              {followModalUsers.length > 0 ? (
                followModalUsers.map((user) => (
                  <div key={user._id} className="user-list-item" onClick={() => handleUserClick(user)}>
                    <img
                      src={getProfilePictureUrl(user.profile_picture) || defaultAvatar}
                      alt={user.name}
                      className="user-list-avatar"
                    />
                    <div className="user-list-info">
                      <div className="user-list-name">{user.name}</div>
                      <div className="user-list-username">@{user.user_name}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-users-message">
                  No {followModalType} yet
                </div>
              )}
            </div>
            <button className="close-button" onClick={() => setShowFollowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement;
