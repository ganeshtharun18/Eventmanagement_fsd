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

export const createAnnouncement = async (announcement) => {
  const response = await fetch(`${API_URL}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret
    },
    body: JSON.stringify(announcement),
  });
  return response.json();
};

export const getAnnouncements = async () => {
  const response = await fetch(`${API_URL}/announcements`);
  return response.json();
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
  const response = await fetch(`${API_URL}/export/events/excel`, {
    headers: {
      'x-admin-secret': adminSecret
    },
  });
  return response.blob();
};

export const exportEventsPDF = async () => {
  const response = await fetch(`${API_URL}/export/events/pdf`, {
    headers: {
      'x-admin-secret': adminSecret
    },
  });
  return response.blob();
};
