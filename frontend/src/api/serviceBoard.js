// src/api/auth.js
import {
    getCurrentUser,
} from "./auth";
const BASE_URL = "http://127.0.0.1:5000/services";

// // CSRF token for security
// const getCookie = (name) => {
//     const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
//     return match ? match[2] : null;
// };

// const csrfToken = getCookie("csrf_access_token");

export const postRequest = async (formData) => {
    const user = await getCurrentUser();
    const time = new Date().toISOString();
    formData["userName"] = user.user_name;
    formData.append("postTime", time);

    const res = await fetch(`${BASE_URL}/request`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    const data = await res.json();
    return { status: res.status, data };
};

export const postOffer = async (formData) => {
    const user = await getCurrentUser();
    const time = new Date().toISOString();
    formData["userName"] = user.user_name;
    formData.append("postTime", time);

    const res = await fetch(`${BASE_URL}/offer`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    const data = await res.json();
    return { status: res.status, data };
};

export const getServices = async () => {
    const res = await fetch(`${BASE_URL}/`, {
        method: "GET",
        credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch services: ${res.status}`);
    }
    return res.json();
  };

export const getImageById = async (imageId) => {
    const res = await fetch(`${BASE_URL}/images/${imageId}`, {
        method: "GET",
        credentials: "include",
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.status}`);
    }
    const res_blob = await res.blob();
    return res_blob;
}

export const postReply = async (replyData) => {
    const user = await getCurrentUser();
    replyData.append("userName", user.user_name);
    const res = await fetch(`${BASE_URL}/reply`, {
        method: "POST",
        credentials: "include",
        body: replyData,
    });
    const data = await res.json();
    return { status: res.status, data };
}

export const getReplies = async (serviceId) => {
    const res = await fetch(`${BASE_URL}/reply/${serviceId}`, {
        method: "GET",
        credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch replies: ${res.status}`);
    }
    return res.json();
}

// Filtered version of getServices
export const getFilteredServices = async (filters = {}) => {
    const allServices = await getServices();
  
    const { userName, serviceType, serviceCategory, petType, hasImage, hasLocation, hasRealName } = filters;
  
    return allServices.filter(service => {
      if ((userName !== undefined) && service.user_name !== userName) return false;
      if ((serviceType !== undefined) && service.service_type !== serviceType) return false;
      if ((serviceCategory !== undefined) && service.service_category !== serviceCategory) return false;
      if ((petType !== undefined) && service.pet_type !== petType && service.pet_type !== 'either') return false;
      if ((hasImage !== undefined) && (hasImage !== !!(service.pet_image && service.pet_image !== 'null'))) return false;
      if ((hasLocation !== undefined) && (hasLocation !== !!(service.location && service.location.place_name))) return false;
      if ((hasRealName !== undefined) && (hasRealName !== !!(service.first_name && service.last_name))) return false;
      return true;
    });
  };

export const sortServices = async (services, sortOptions) => {
    const { by, order } = sortOptions;
    const isAsc = order === 'asc';
  
    if (by === 'Post Time') {
      return services.sort((a, b) =>
        (! isAsc) ? new Date(a.post_time) - new Date(b.post_time) : new Date(b.post_time) - new Date(a.post_time)
      );
    }
  
    if (by === 'Start Time') {
      return services.sort((a, b) => {
        const aTime = new Date(a.availability?.start || 0);
        const bTime = new Date(b.availability?.start || 0);
        return isAsc ? aTime - bTime : bTime - aTime;
      });
    }
  
    if (by === 'End Time') {
      return services.sort((a, b) => {
        const aTime = new Date(a.availability?.end || 0);
        const bTime = new Date(b.availability?.end || 0);
        return isAsc ? aTime - bTime : bTime - aTime;
      });
    }
  
    if (by === 'Latest Reply Time') {
      const servicesWithReplies = await Promise.all(services.map(async (service) => {
        try {
          const replies = await getReplies(service._id);
          let latestReplyTime = service.post_time;
          Object.values(replies).forEach(thread => {
            thread.forEach(replyObj => {
              const [_, timestamp] = Object.values(replyObj)[0];
              if (timestamp && (!latestReplyTime || timestamp > latestReplyTime)) {
                latestReplyTime = timestamp;
              }
            });
          });
          return { ...service, latestReplyTime };
        } catch {
          return { ...service, latestReplyTime: service.post_time };
        }
      }));
  
      return servicesWithReplies.sort((a, b) =>
        (! isAsc) ? new Date(a.latestReplyTime) - new Date(b.latestReplyTime) : new Date(b.latestReplyTime) - new Date(a.latestReplyTime)
      );
    }
  
    return services;
  };
  
export const deleteService = async (serviceId) => {
    const res = await fetch(`${BASE_URL}/${serviceId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) {
        throw new Error(`Failed to delete service: ${res.status}`);
    }
    const data = await res.json();
    return { status: res.status, data };
};

export const confirmMatch = async (serviceId, targetUserName) => {
    const res = await fetch(`${BASE_URL}/match`, {
        method: "PUT",
        credentials: "include",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ service_id: serviceId, matched_user: targetUserName }),
    });
    if (!res.ok) {
        throw new Error(`Failed to confirm match: ${res.status}`);
    }
    const data = await res.json();
    return { status: res.status, data };
  }