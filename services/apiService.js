import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { getSessionCookie, buildCookieHeader, setSessionCookie, extractCookieFromResponse } from '../utils/cookieHelper';
import { isSessionExpired, handleApiError, safeParseResponse } from '../utils/errorHandler';

/**
 * Make API request with session cookie handling
 * @param {string} endpoint - API endpoint (relative to base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Get session cookie (session ID from backend response)
  const sessionCookie = await getSessionCookie();
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };
  
  // Add cookie header if session exists
  // Format: evitals_session=<session_id>
  if (sessionCookie) {
    headers['Cookie'] = buildCookieHeader(sessionCookie);
  }
  
  // Prepare fetch options
  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Important for cookies (though React Native has limitations)
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Try to extract cookie from response (may not work in React Native)
    // But also check response body for session_id (for mobile clients)
    try {
      const newCookie = extractCookieFromResponse(response);
      if (newCookie && newCookie !== sessionCookie) {
        await setSessionCookie(newCookie);
      }
    } catch (error) {
      // Ignore cookie extraction errors in React Native
      // The session should be managed via response body for mobile
    }
    
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * API Service - Centralized API calls
 */
const apiService = {
  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @param {boolean} remember - Remember me option
   * @returns {Promise<object>} - Login response
   */
  login: async (username, password, remember = false) => {
    // For mobile clients, add a flag so backend knows to return session_id
    const response = await apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim(),
        remember: remember ? 'on' : '',
        mobile_client: true, // Flag to indicate mobile client
      }),
    });
    
    // Parse response first (this consumes the response body)
    const data = await safeParseResponse(response);
    
    // Check response status and data
    if (!response.ok) {
      // Use data message if available, otherwise use status-based message
      const errorMessage = data?.message || 
                          (response.status === 401 ? 'Invalid username or password' : 
                           response.status === 403 ? 'Access denied' :
                           response.status === 500 ? 'Server error' :
                           'Login failed');
      throw new Error(errorMessage);
    }
    
    if (!data || !data.success) {
      throw new Error(data?.message || 'Login failed');
    }
    
    // React Native doesn't expose Set-Cookie headers
    // Backend should return session_id in response body for mobile clients
    if (data.session_id) {
      await setSessionCookie(data.session_id);
      console.log('✅ Session ID stored for mobile client');
    } else {
      // Fallback: Try to extract from headers (won't work in React Native but won't crash)
      try {
        const cookie = extractCookieFromResponse(response);
        if (cookie) {
          await setSessionCookie(cookie);
        } else {
          console.warn('⚠️ Could not extract session cookie. Backend should return session_id in response body for mobile clients.');
        }
      } catch (error) {
        // Ignore cookie extraction errors in React Native
        console.warn('⚠️ Cookie extraction not available in React Native');
      }
    }
    
    return data;
  },
  
  /**
   * Verify OTP
   * @param {string} otp - OTP code
   * @returns {Promise<object>} - OTP verification response
   */
  verifyOTP: async (otp) => {
    const response = await apiRequest(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify({ 
        otp,
        mobile_client: true // Flag for mobile client
      }),
    });
    
    const data = await safeParseResponse(response);
    
    if (!response.ok || !data || !data.success) {
      const errorMessage = await handleApiError(response, 'OTP verification failed');
      throw new Error(errorMessage);
    }
    
    // Get session_id from response body (for mobile clients)
    if (data.session_id) {
      await setSessionCookie(data.session_id);
    } else {
      // Fallback: Try to extract from headers
      try {
        const cookie = extractCookieFromResponse(response);
        if (cookie) {
          await setSessionCookie(cookie);
        }
      } catch (error) {
        console.warn('Error extracting cookie:', error.message);
      }
    }
    
    return data;
  },
  
  /**
   * Logout user
   * @returns {Promise<boolean>} - True if successful
   */
  logout: async () => {
    try {
      await apiRequest(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
      });
      
      // Clear session cookie
      await setSessionCookie(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear cookie anyway
      await setSessionCookie(null);
      return false;
    }
  },
  
  /**
   * Get current user
   * @returns {Promise<object>} - User data
   */
  getCurrentUser: async () => {
    const response = await apiRequest(API_ENDPOINTS.GET_CURRENT_USER, {
      method: 'GET',
    });
    
    // Check for session expiry
    if (await isSessionExpired(response)) {
      await setSessionCookie(null);
      throw new Error('Session expired. Please login again.');
    }
    
    const data = await safeParseResponse(response);
    
    if (!response.ok || !data || !data.success) {
      const errorMessage = await handleApiError(response, 'Failed to get user data');
      throw new Error(errorMessage);
    }
    
    return data;
  },
  
  /**
   * Get current patient profile (for patient role)
   * @returns {Promise<object>} - Patient data
   */
  getPatientProfile: async () => {
    const response = await apiRequest(API_ENDPOINTS.GET_PATIENT_ME, {
      method: 'GET',
    });
    
    if (await isSessionExpired(response)) {
      await setSessionCookie(null);
      throw new Error('Session expired. Please login again.');
    }
    
    const data = await safeParseResponse(response);
    
    if (!response.ok || !data || !data.success) {
      const errorMessage = await handleApiError(response, 'Failed to get patient profile');
      throw new Error(errorMessage);
    }
    
    return data;
  },
  
  /**
   * Get patient details (with practiceId and patientId)
   * @param {number} practiceId - Practice ID
   * @param {number} patientId - Patient ID
   * @returns {Promise<object>} - Patient details
   */
  getPatientDetails: async (practiceId, patientId) => {
    const endpoint = API_ENDPOINTS.GET_PATIENT_DETAILS(practiceId, patientId);
    const response = await apiRequest(endpoint, {
      method: 'GET',
    });
    
    if (await isSessionExpired(response)) {
      await setSessionCookie(null);
      throw new Error('Session expired. Please login again.');
    }
    
    const data = await safeParseResponse(response);
    
    if (!response.ok || !data || !data.success) {
      const errorMessage = await handleApiError(response, 'Failed to get patient details');
      throw new Error(errorMessage);
    }
    
    return data;
  },
  
  /**
   * Get blood pressure measurements
   * @param {number} practiceId - Practice ID
   * @param {number} patientId - Patient ID
   * @param {object} params - Query parameters (fromDate, toDate, sortBy)
   * @returns {Promise<object>} - Blood pressure data
   */
  getBloodPressure: async (practiceId, patientId, params = {}) => {
    let endpoint = API_ENDPOINTS.GET_BLOOD_PRESSURE(practiceId, patientId);
    
    // Add query parameters
    const queryParams = new URLSearchParams();
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }
    
    const response = await apiRequest(endpoint, {
      method: 'GET',
    });
    
    if (await isSessionExpired(response)) {
      await setSessionCookie(null);
      throw new Error('Session expired. Please login again.');
    }
    
    const data = await safeParseResponse(response);
    
    if (!response.ok || !data || !data.success) {
      const errorMessage = await handleApiError(response, 'Failed to get blood pressure data');
      throw new Error(errorMessage);
    }
    
    return data;
  },
  
  /**
   * Get blood glucose measurements
   * @param {number} practiceId - Practice ID
   * @param {number} patientId - Patient ID
   * @param {object} params - Query parameters (fromDate, toDate, sortBy)
   * @returns {Promise<object>} - Blood glucose data
   */
  getBloodGlucose: async (practiceId, patientId, params = {}) => {
    let endpoint = API_ENDPOINTS.GET_BLOOD_GLUCOSE(practiceId, patientId);
    
    const queryParams = new URLSearchParams();
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }
    
    const response = await apiRequest(endpoint, {
      method: 'GET',
    });
    
    if (await isSessionExpired(response)) {
      await setSessionCookie(null);
      throw new Error('Session expired. Please login again.');
    }
    
    const data = await safeParseResponse(response);
    
    if (!response.ok || !data || !data.success) {
      const errorMessage = await handleApiError(response, 'Failed to get blood glucose data');
      throw new Error(errorMessage);
    }
    
    return data;
  },
  
  /**
   * Get weight measurements
   * @param {number} practiceId - Practice ID
   * @param {number} patientId - Patient ID
   * @param {object} params - Query parameters (fromDate, toDate, sortBy)
   * @returns {Promise<object>} - Weight data
   */
  getWeight: async (practiceId, patientId, params = {}) => {
    let endpoint = API_ENDPOINTS.GET_WEIGHT(practiceId, patientId);
    
    const queryParams = new URLSearchParams();
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }
    
    const response = await apiRequest(endpoint, {
      method: 'GET',
    });
    
    if (await isSessionExpired(response)) {
      await setSessionCookie(null);
      throw new Error('Session expired. Please login again.');
    }
    
    const data = await safeParseResponse(response);
    
    if (!response.ok || !data || !data.success) {
      const errorMessage = await handleApiError(response, 'Failed to get weight data');
      throw new Error(errorMessage);
    }
    
    return data;
  },
};

export default apiService;
