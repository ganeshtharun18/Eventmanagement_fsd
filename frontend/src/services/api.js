const API_URL = 'http://localhost:5000/api';

// Auth endpoints
export const register = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return response.json();
};

export const login = async (credentials) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  return response.json();
};

// Event endpoints
export const getEvents = async (username, role) => {
  const response = await fetch(`${API_URL}/events?username=${username}&role=${role}`);
  return response.json();
};

export const createEvent = async (eventData) => {
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });
  return response.json();
};

export const updateEvent = async (eventId, eventData) => {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });
  return response.json();
};

export const deleteEvent = async (eventId) => {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: 'DELETE',
  });
  return response.json();
};

// Admin endpoints
export const getUsers = async () => {
  try {
    // 1. Check for session token
    const sessionToken = localStorage.getItem('adminSessionToken');
    if (!sessionToken) {
      throw new Error('ADMIN_SESSION_EXPIRED');
    }

    // 2. Make API request
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Helps identify AJAX requests
      },
      credentials: 'include'
    });

    // 3. Handle HTTP errors
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.warn('Failed to parse error response:', parseError);
      }

      // Clear invalid token if auth failed
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminSessionToken');
        throw new Error(errorData.message || 'Admin access denied. Please log in again.');
      }

      // Handle other HTTP errors
      throw new Error(
        errorData.message || 
        `Server responded with status ${response.status}`
      );
    }

    // 4. Parse and validate response data
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error('Failed to parse server response');
    }

    // Validate data structure
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: Expected array of users');
    }

    // Validate user objects (optional)
    if (data.length > 0) {
      const requiredFields = ['username', 'email', 'role'];
      const isValid = data.every(user => 
        requiredFields.every(field => user.hasOwnProperty(field))
      );
      
      if (!isValid) {
        console.warn('Malformed user data:', data);
        throw new Error('Server returned incomplete user data');
      }
    }

    return data;

  } catch (error) {
    console.error('Failed to fetch users:', error);
    
    // Enhance specific error messages
    switch (true) {
      case error.message === 'ADMIN_SESSION_EXPIRED':
        throw new Error('Your session has expired. Please log in again.');
      
      case error.message.includes('Failed to fetch'):
        throw new Error('Network error. Please check your internet connection.');
      
      case error.message.includes('NetworkError'):
        throw new Error('Cannot connect to server. Please try again later.');
      
      default:
        throw error; // Re-throw original error
    }
  }
};

export const updateUserRole = async (username, role) => {
  const response = await fetch(`${API_URL}/admin/users/${username}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': localStorage.getItem('adminToken'),
    },
    body: JSON.stringify({ role }),
  });
  return response.json();
};

export const deleteUser = async (username) => {
  const response = await fetch(`${API_URL}/admin/users/${username}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Token': localStorage.getItem('adminToken'),
    },
  });
  return response.json();
};


// Add to your api.js file (with other admin endpoints)
export const bulkEventAction = async (actionType, eventIds) => {
  const response = await fetch(`${API_URL}/admin/events/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': localStorage.getItem('adminToken'),
    },
    body: JSON.stringify({ actionType, eventIds }),
  });
  return response.json();
};

// Announcements
export const createAnnouncement = async (announcement) => {
  const response = await fetch(`${API_URL}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': localStorage.getItem('adminToken'),
    },
    body: JSON.stringify(announcement),
  });
  return response.json();
};

export const getAnnouncements = async () => {
  const response = await fetch(`${API_URL}/announcements`);
  return response.json();
};

// Categories
export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);
  return response.json();
};

export const createCategory = async (category) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': localStorage.getItem('adminToken'),
    },
    body: JSON.stringify(category),
  });
  return response.json();
};

// Analytics
export const getEventAnalytics = async (timeRange) => {
  const response = await fetch(`${API_URL}/analytics/events?range=${timeRange}`, {
    headers: {
      'X-Admin-Token': localStorage.getItem('adminToken'),
    },
  });
  return response.json();
};

// Export
export const exportEventsExcel = async () => {
  const response = await fetch(`${API_URL}/export/events/excel`, {
    headers: {
      'X-Admin-Token': localStorage.getItem('adminToken'),
    },
  });
  return response.blob();
};

export const exportEventsPDF = async () => {
  const response = await fetch(`${API_URL}/export/events/pdf`, {
    headers: {
      'X-Admin-Token': localStorage.getItem('adminToken'),
    },
  });
  return response.blob();
};