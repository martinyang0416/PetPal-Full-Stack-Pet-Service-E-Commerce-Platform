import React, { useState, useEffect } from 'react';
import { getFollowRequests, handleFollowRequest, getProfilePictureUrl } from '../api/profile';
import defaultAvatar from '../Assets/user.png';
import './FollowRequests.css';

const FollowRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRequests = async () => {
    try {
      const data = await getFollowRequests();
      console.log('Loaded requests:', data); // Debug log
      setRequests(data);
      setError(null);
    } catch (err) {
      console.error('Error loading follow requests:', err);
      setError('Failed to load follow requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // Refresh requests every 30 seconds
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRequest = async (requestId, action) => {
    try {
      setLoading(true);
      await handleFollowRequest(requestId, action);
      // Refresh the requests list after handling
      await loadRequests();
    } catch (err) {
      console.error('Error handling follow request:', err);
      setError('Failed to handle follow request');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading follow requests...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="follow-requests-container">
      <h2>Follow Requests</h2>
      {requests.length === 0 ? (
        <p className="no-requests">No pending follow requests</p>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.request_id} className="request-item">
              <div className="request-user-info">
                <img
                  src={getProfilePictureUrl(request.requester.profile_picture) || defaultAvatar}
                  alt={request.requester.name}
                  className="request-user-avatar"
                />
                <div className="request-user-details">
                  <span className="request-user-name">{request.requester.name}</span>
                  <span className="request-user-username">@{request.requester.username}</span>
                </div>
              </div>
              <div className="request-actions">
                <button
                  className="accept-button"
                  onClick={() => handleRequest(request.request_id, 'accept')}
                >
                  Accept
                </button>
                <button
                  className="reject-button"
                  onClick={() => handleRequest(request.request_id, 'reject')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowRequests; 