// Centralized API Client utility using native fetch wrapper.
const BASE_URL = import.meta.env.VITE_API_URL || '';

let activeToken = null;
let onSessionExpiredCallback = null;

export const api = {
  setToken: (token) => {
    activeToken = token;
  },

  getToken: () => activeToken,

  registerSessionExpiredCallback: (callback) => {
    onSessionExpiredCallback = callback;
  },

  request: async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    
    // Setup headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle token refreshing / expired session
      if (response.status === 401) {
        if (onSessionExpiredCallback) {
          onSessionExpiredCallback();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Unauthorized access. Session expired.');
      }

      // Check for success status range
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      // Parse JSON response safely
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('[API Client Error]:', error);
      throw error;
    }
  },

  get: (endpoint, options = {}) => {
    return api.request(endpoint, { ...options, method: 'GET' });
  },

  post: (endpoint, body, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put: (endpoint, body, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  patch: (endpoint, body, options = {}) => {
    return api.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete: (endpoint, options = {}) => {
    return api.request(endpoint, { ...options, method: 'DELETE' });
  },
};
export default api;
