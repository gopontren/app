/**
 * API Client Utility
 * Helper untuk memanggil API dari frontend dengan authentication
 */

// Base URL - akan otomatis detect production atau development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.origin) || 
  'http://localhost:3000';

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('goPontrenToken') || localStorage.getItem('token');
}

/**
 * Generic API call function
 */
export async function apiCall(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    requireAuth = true,
  } = options;

  // Build headers
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if required
  if (requireAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Build request config
  const config = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  // Make request
  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: (endpoint, options = {}) => 
    apiCall(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options = {}) => 
    apiCall(endpoint, { ...options, method: 'POST', body }),
  
  put: (endpoint, body, options = {}) => 
    apiCall(endpoint, { ...options, method: 'PUT', body }),
  
  delete: (endpoint, options = {}) => 
    apiCall(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Example usage in frontend:
 * 
 * import { api } from './lib/utils/api-client';
 * 
 * // Login (no auth required)
 * const response = await api.post('/auth/login', {
 *   email: 'admin@example.com',
 *   password: '123456'
 * }, { requireAuth: false });
 * 
 * localStorage.setItem('goPontrenToken', response.data.token);
 * 
 * // Get data (auth required)
 * const santri = await api.get('/pesantren/pesantren-nf/santri');
 * 
 * // Create data
 * const newSantri = await api.post('/pesantren/pesantren-nf/santri', {
 *   name: 'Ahmad Zaki',
 *   nis: '20240001',
 *   classId: 'kelas-1'
 * });
 */
