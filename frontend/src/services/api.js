const API_URL = 'http://localhost:5000/api';

// Static admin secret (move to .env in production)
const adminSecret = 'supersecretkey123';

// ------------------ AUTH ------------------

export const register = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response.json();
};

export const login = async (credentials) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return response.json();
};

// ------------------ EVENTS ------------------

export const getEvents = async (username, role) => {
  const response = await fetch(`${API_URL}/events?username=${username}&role=${role}`);
  return response.json();
};

export const createEvent = async (eventData) => {
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  return response.json();
};

export const updateEvent = async (eventId, eventData) => {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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

// ------------------ ADMIN USERS ------------------

export const getUsers = async () => {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: 'GET',
    headers: {
      'x-admin-secret': adminSecret,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`Server responded with status ${response.status}`);
    }
    throw new Error(errorData.message || 'Failed to fetch users');
  }

  const data = await response.json();
  return data;
};

export const updateUserRole = async (username, role) => {
  const response = await fetch(`${API_URL}/admin/users/${username}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret
    },
    body: JSON.stringify({ role }),
  });
  return response.json();
};

export const deleteUser = async (username) => {
  const response = await fetch(`${API_URL}/admin/users/${username}`, {
    method: 'DELETE',
    headers: {
      'x-admin-secret': adminSecret
    },
  });
  return response.json();
};

// ------------------ ADMIN EVENTS ------------------

export const bulkEventAction = async (actionType, eventIds) => {
  const response = await fetch(`${API_URL}/admin/events/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret
    },
    body: JSON.stringify({ actionType, eventIds }),
  });
  return response.json();
};

// ------------------ ANNOUNCEMENTS ------------------

//const API_URL = 'http://localhost:5000/api';

// Hardcoded admin secret (for demo; secure this in production)
//const adminSecret = 'supersecretkey123';

// Create an announcement (only Admins allowed)

export const createAnnouncement = async (announcement) => {
  const response = await fetch(`${API_URL}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
      'x-username': announcement.created_by || "admin" // optional
    },
    body: JSON.stringify(announcement),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create announcement');
  }

  return response.json();
};


// Get recent announcements
export const getAnnouncements = async () => {
  try {
    const response = await fetch(`${API_URL}/announcements`);

    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }

    return await response.json();
  } catch (err) {
    console.error('Error in getAnnouncements:', err);
    return [];
  }
};


// ------------------ CATEGORIES ------------------

export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);
  return response.json();
};

export const createCategory = async (category) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret
    },
    body: JSON.stringify(category),
  });
  return response.json();
};

// ------------------ ANALYTICS ------------------

export const getEventAnalytics = async (timeRange) => {
  const response = await fetch(`${API_URL}/analytics/events?range=${timeRange}`, {
    headers: {
      'x-admin-secret': adminSecret
    },
  });
  return response.json();
};

// ------------------ EXPORT ------------------

export const exportEventsExcel = async () => {
  try {
    const response = await fetch(`${API_URL}/export/events/excel`, {
      method: 'GET',
      headers: {
        'x-admin-secret': adminSecret
      }
    });

    if (!response.ok) {
      throw new Error(`Excel export failed: ${response.statusText}`);
    }

    return await response.blob(); // Return Excel file blob
  } catch (error) {
    console.error('Error exporting Excel:', error);
    throw error;
  }
};

export const exportEventsPDF = async () => {
  try {
    const response = await fetch(`${API_URL}/export/events/pdf`, {
      method: 'GET',
      headers: {
        'x-admin-secret': adminSecret
      }
    });

    if (!response.ok) {
      throw new Error(`PDF export failed: ${response.statusText}`);
    }

    return await response.blob(); // Return PDF file blob
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};


export const getUpcomingEvents = async (username) => {
  const response = await fetch(`${API_URL}/upcoming-events/${username}`);
  if (!response.ok) throw new Error('Failed to fetch upcoming events');
  return response.json();
};
