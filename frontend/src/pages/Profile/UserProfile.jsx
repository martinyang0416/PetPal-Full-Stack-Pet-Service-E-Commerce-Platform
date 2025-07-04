import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProfileManagement.css";
import defaultAvatar from '../../Assets/user.png';
import {
  getProfilePictureUrl,
  followUser,
  unfollowUser,
  checkFollowStatus,
  getFollowStats,
  getFollowers,
  getFollowing,
  getUserProfile,
  fetchProfile,
  fetchPets,
  getUserPets,
  rateUser,
  getUserReviews
} from "../../api/profile";

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');
  const [followModalUsers, setFollowModalUsers] = useState([]);
  const [openSections, setOpenSections] = useState({});
  const [selectedPet, setSelectedPet] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage('');
      
      // Get current user's profile first
      const myProfile = await fetchProfile();
      setCurrentUser(myProfile.user_name);
      
      const profileData = await getUserProfile(username);
      console.log("Profile data loaded:", {
        username,
        is_following: profileData.is_following,
        followers_count: profileData.followers_count,
        following_count: profileData.following_count
      });
      
      setProfile(profileData);
      setIsFollowing(profileData.is_following);
      
      // Set follow stats directly from profile data
      setFollowStats({
        followersCount: profileData.followers_count || 0,
        followingCount: profileData.following_count || 0
      });

      if (!profileData.is_private || profileData.is_following) {
        try {
          const [petsData, reviewsData] = await Promise.all([
            getUserPets(username),
            getUserReviews(username)
          ]);
          setPets(petsData || []);
          setReviews(reviewsData?.reviews || []);
        } catch (err) {
          console.error("Error loading additional data:", err);
        }
      }
    } catch (err) {
      console.error("Error loading profile data:", err);
      setError(err.message || "Failed to load profile data. Please try again later.");
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [username]);

  const handleFollowToggle = async () => {
    if (followLoading) return;
    
    try {
      setFollowLoading(true);
      setError(null);
      
      if (isFollowing) {
        const result = await unfollowUser(username);
        if (result.error) {
          throw new Error(result.error);
        }
        setIsFollowing(false);
        setProfile(prev => ({
          ...prev,
          is_following: false,
          followers_count: result.followers_count,
          following_count: result.following_count
        }));
        
        setFollowStats({
          followersCount: result.followers_count,
          followingCount: result.following_count
        });
      } else {
        const result = await followUser(username);
        if (result.error) {
          throw new Error(result.error);
        }
        setIsFollowing(true);
        setProfile(prev => ({
          ...prev,
          is_following: true,
          followers_count: result.followers_count,
          following_count: result.following_count
        }));
        
        setFollowStats({
          followersCount: result.followers_count,
          followingCount: result.following_count
        });
      }
      
    } catch (err) {
      console.error("Follow toggle error:", err);
      setError(err.message || "Failed to update follow status");
      // Reload profile data to ensure UI is in sync with backend
      loadData();
    } finally {
      setFollowLoading(false);
    }
  };

  const getFollowButtonText = () => {
    if (followLoading) return 'Loading...';
    if (isFollowing) return 'Following';
    return 'Follow';
  };

  const getFollowButtonClass = () => {
    const baseClass = 'follow-button';
    if (isFollowing) return `${baseClass} following`;
    return baseClass;
  };

  const handleShowFollows = async (type) => {
    try {
      setFollowModalType(type);
      setShowFollowModal(true);
      setFollowModalUsers([]); 
      
      const users = type === 'followers' 
        ? await getFollowers(username)
        : await getFollowing(username);
      
      console.log(`${type} users:`, users); 
      setFollowModalUsers(users || []);
      
      // Update follow stats only if the counts are different
      const newCount = users?.length || 0;
      setFollowStats(prevStats => {
        const updatedStats = {
          ...prevStats,
          [type === 'followers' ? 'followersCount' : 'followingCount']: newCount
        };
        
        // Only update if the counts are different
        if (type === 'followers' && prevStats.followersCount !== newCount) {
          return updatedStats;
        }
        if (type === 'following' && prevStats.followingCount !== newCount) {
          return updatedStats;
        }
        return prevStats;
      });
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(err.message);
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleRateUser = async () => {
    if (!rating) {
      setError("Please select a rating");
      return;
    }
    
    setIsSubmittingRating(true);
    setError(null);
    
    try {
      await rateUser(username, rating, comment);
      const reviewsData = await getUserReviews(username);
      setReviews(reviewsData.reviews);
      setShowRatingModal(false);
      setRating(0);
      setComment("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (isLoading) return <div className="loading-spinner">Loading profile...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!profile) return <div className="error-message">Profile not found.</div>;

  return (
    <div className="profile-page-container">
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
      <div className="profile-main-content">
        <div className="profile-container">
          <img
            className="profile-picture"
            src={getProfilePictureUrl(profile.profile_picture) || defaultAvatar}
            alt="Profile"
          />
          <div className="profile-name-row">
            <div className="profile-name">{profile.name?.trim() || "Anonymous"}</div>
          </div>

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

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

          {profile.is_private && !profile.is_following && username !== currentUser ? (
            <div className="private-profile-message">
              <h3>Private Profile</h3>
              <p>This profile is private. Follow this user to view their profile details.</p>
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={getFollowButtonClass()}
              >
                {getFollowButtonText()}
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={getFollowButtonClass()}
                onMouseEnter={(e) => {
                  if (isFollowing) {
                    e.target.textContent = 'Unfollow';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isFollowing) {
                    e.target.textContent = 'Following';
                  }
                }}
              >
                {getFollowButtonText()}
              </button>

              {profile.identity?.length > 0 && (
                <div className="profile-identity">
                  {profile.identity.map((role) => (
                    <span className="identity-tag" key={role}>
                      {role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              )}

              <div className="profile-location">
                {`${profile.location?.city || ""}, ${profile.location?.state || ""}, ${profile.location?.country || ""}`.replace(/^, |, ,/g, "")}
              </div>

              <div className="profile-bio">{profile.bio?.trim() || "No bio provided."}</div>

              {/* Only show these sections if profile is public, user is following, or it's own profile */}
              {(!profile.is_private || profile.is_following || username === currentUser) && (
                <>
                  <div className={`accordion ${openSections.contact ? "active" : ""}`}>
                    <div className="accordion-header" onClick={() => toggleSection("contact")}>Contact</div>
                    <div className="accordion-body">
                      <p>Email: {profile.contact?.email}</p>
                      <p>Phone: {profile.contact?.phone_number}</p>
                    </div>
                  </div>

                  {profile.identity?.includes("service_provider") && (
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
                            <p className="total-reviews">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</p>
                          </div>
                          {reviews.length > 0 ? (
                            <div className="reviews-list">
                              {reviews.map((review, index) => (
                                <div key={index} className="review-item">
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

                  {profile.identity?.includes("pet_owner") && (
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
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.identity?.includes("service_provider") && (
                    <div className="rating-section-bottom">
                      <button 
                        className="rate-button"
                        onClick={() => setShowRatingModal(true)}
                      >
                        Rate Service Provider
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
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
                  <button onClick={() => setSelectedPet(null)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {showFollowModal && (
            <div className="modal-backdrop" onClick={() => setShowFollowModal(false)}>
              <div className="modal user-list-modal" onClick={(e) => e.stopPropagation()}>
                <h3>{followModalType === 'followers' ? 'Followers' : 'Following'}</h3>
                <div className="user-list">
                  {followModalUsers && followModalUsers.length > 0 ? (
                    followModalUsers.map((user) => (
                      <div 
                        key={user._id} 
                        className="user-list-item" 
                        onClick={() => {
                          setShowFollowModal(false);
                          navigate(`/user/${user.user_name}`);
                        }}
                      >
                        <img
                          src={getProfilePictureUrl(user.profile_picture) || defaultAvatar}
                          alt={user.name}
                          className="user-list-avatar"
                        />
                        <div className="user-list-info">
                          <div className="user-list-name">{user.name || 'Anonymous'}</div>
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

          {showRatingModal && (
            <div className="modal-backdrop" onClick={() => setShowRatingModal(false)}>
              <div className="modal rating-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Rate {profile.name}</h3>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= rating ? 'selected' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <textarea
                  placeholder="Write a review (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="review-textarea"
                />
                {error && <div className="error-message">{error}</div>}
                <div className="modal-buttons">
                  <button
                    onClick={handleRateUser}
                    disabled={isSubmittingRating}
                    className="submit-rating-button"
                  >
                    {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                  </button>
                  <button 
                    onClick={() => setShowRatingModal(false)}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showReviewsModal && (
            <div className="modal-backdrop" onClick={() => setShowReviewsModal(false)}>
              <div className="modal reviews-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Reviews</h3>
                <div className="reviews-list">
                  {reviews.map((review, index) => (
                    <div key={index} className="review-item">
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
                <button className="close-button" onClick={() => setShowReviewsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 