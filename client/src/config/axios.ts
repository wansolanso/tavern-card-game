import axios from 'axios';
import { API_CONFIG } from './constants';

/**
 * Configured axios instance for API calls
 *
 * Security features:
 * - withCredentials: true - Enables HttpOnly cookie support
 * - Automatically sends cookies with all requests
 * - No need to manually manage JWT tokens in localStorage
 */
const apiClient = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}`,
  withCredentials: true, // Enable cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      // In a guest session game, we could auto-create a new session
      console.error('Authentication failed - session expired');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
