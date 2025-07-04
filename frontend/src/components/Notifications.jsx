import React, { useState } from 'react';
import FollowRequests from './FollowRequests';
import NotificationBadge from './NotificationBadge';
import './Notifications.css';

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notifications-container">
      <button 
        className="notifications-button" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-bell"></i>
        <NotificationBadge />
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="notifications-content">
            <FollowRequests />
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications; 