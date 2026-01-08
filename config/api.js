// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://13.233.6.224:3007/api',
  STAGING: true,
  TIMEOUT: 30000, // 30 seconds
};

// Session cookie name
export const SESSION_COOKIE_NAME = 'evitals_session';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/users/login',
  VERIFY_OTP: '/users/verify-otp',
  LOGOUT: '/users/logout',
  GET_CURRENT_USER: '/users/me',
  SESSION_STATUS: '/users/session-status',
  
  // Patient Data
  GET_PATIENT_ME: '/patients/me',
  GET_PATIENT_DETAILS: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/details`,
  
  // Patient Vitals
  GET_BLOOD_PRESSURE: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/measurements/blood-pressure`,
  GET_BLOOD_GLUCOSE: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/measurements/blood-glucose`,
  GET_WEIGHT: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/measurements/weight`,
};
