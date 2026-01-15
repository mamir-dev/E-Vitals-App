// API Configuration
import { Platform } from 'react-native';

// Determine the correct base URL based on platform
const getBaseURL = () => {
  // STAGING: Use staging server
  return 'http://13.233.6.224:3007/api';

  // LOCAL: For Android emulator, use 10.0.2.2 (special IP to access host machine)
  // For iOS simulator, use localhost
  // For physical devices, use your computer's local IP (e.g., 192.168.1.100)

  // if (Platform.OS === 'android') {
  //   // Android emulator - use localhost with ADB reverse port forwarding
  //   // Run: adb reverse tcp:3000 tcp:3000 (already done)
  //   // Alternative: use 10.0.2.2:3000 if ADB reverse doesn't work
  //   return 'http://localhost:3000/api'; // Works with ADB reverse
  //   // return 'http://10.0.2.2:3000/api'; // Alternative if ADB reverse not available
  //   // return 'http://192.168.1.XXX:3000/api'; // For physical device - replace XXX with your local IP
  // } else {
  //   // iOS simulator - localhost works fine
  //   return 'http://localhost:3000/api';
  // }
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
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
  CHANGE_PASSWORD: '/users/change-password',
  FORGOT_PASSWORD_OTP: '/users/forgot-password-otp',
  VERIFY_PASSWORD_RESET_OTP: '/users/verify-password-reset-otp',
  RESET_PASSWORD_OTP: '/users/reset-password-otp',

  // Patient Data
  GET_PATIENT_ME: '/patients/me',
  GET_PATIENT_DETAILS: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/details`,

  // Patient Vitals
  GET_BLOOD_PRESSURE: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/measurements/blood-pressure`,
  GET_BLOOD_GLUCOSE: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/measurements/blood-glucose`,
  GET_WEIGHT: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/measurements/weight`,

  // Settings
  GET_ACCOUNT_SETTINGS: '/settings/account',
  TOGGLE_TWO_WAY_AUTH: (status) => `/settings/two-way-auth/${status}`,
  UPDATE_SESSION_SETTINGS: '/settings/session',
  CLEAR_CACHE: '/settings/clear-cache',

  // Practice Settings
  GET_PRACTICE_RANGES: (practiceId) => `/practices/${practiceId}/settings/ranges`,

  // Anomalies
  GET_BLOOD_PRESSURE_ANOMALIES: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/anomaly/blood-pressure`,
  GET_GLUCOSE_ANOMALIES: (practiceId, patientId) => `/practices/${practiceId}/patients/${patientId}/anomaly/glucose`,
};
