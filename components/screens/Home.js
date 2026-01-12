/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Amna Changes: Added useCallback and useRef
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, StatusBar, ScrollView 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../config/globall';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
import apiService from '../../services/apiService';

// Base dimensions used for scaling calculations (standard phone size)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Color constants
const NAVY_BLUE = '#293d55';
const RED_ACCENT = colors.secondaryButton || '#FF0000';

// ==================== NOTIFICATION PROCESSING HELPERS ====================

// Generate medical alerts with consistent IDs
const generateMedicalAlerts = (patientData) => {
  const alerts = [];
  const measurements = patientData?.measurements || {};

  // Blood Pressure Alerts
  if (measurements.bloodPressure) {
    const bp = measurements.bloodPressure;
    const systolic = bp.systolic || bp.systolic_pressure;
    const diastolic = bp.diastolic || bp.diastolic_pressure;

    if (systolic > 140 || diastolic > 90) {
      alerts.push({
        id: `bp-high-${systolic}-${diastolic}`,
        type: 'Alert',
        title: 'High Blood Pressure',
        message: `Your BP reading ${systolic}/${diastolic} mmHg is above normal range.`,
        date: new Date().toISOString(),
        read: false,
        alertType: 'bloodPressure',
        severity: systolic > 180 || diastolic > 120 ? 'high' : 'medium'
      });
    } else if (systolic < 90 || diastolic < 60) {
      alerts.push({
        id: `bp-low-${systolic}-${diastolic}`,
        type: 'Alert',
        title: 'Low Blood Pressure',
        message: `Your BP reading ${systolic}/${diastolic} mmHg is below normal range.`,
        date: new Date().toISOString(),
        read: false,
        alertType: 'bloodPressure',
        severity: 'medium'
      });
    }
  }

  // Blood Glucose Alerts
  if (measurements.bloodGlucose) {
    const glucose = parseFloat(measurements.bloodGlucose.blood_glucose_value_1 || measurements.bloodGlucose.value || 0);
    
    if (glucose > 126) {
      alerts.push({
        id: `glucose-high-${glucose}`,
        type: 'Alert',
        title: 'High Blood Glucose',
        message: `Your glucose level ${glucose} mg/dL indicates possible diabetes risk.`,
        date: new Date().toISOString(),
        read: false,
        alertType: 'bloodGlucose',
        severity: 'high'
      });
    } else if (glucose > 0 && glucose < 70) {
      alerts.push({
        id: `glucose-low-${glucose}`,
        type: 'Alert',
        title: 'Low Blood Glucose',
        message: `Your glucose level ${glucose} mg/dL is below normal range.`,
        date: new Date().toISOString(),
        read: false,
        alertType: 'bloodGlucose',
        severity: 'medium'
      });
    }
  }

  // Weight Alerts
  if (measurements.weight) {
    const weight = measurements.weight.value;
    const bmi = (weight / (1.7 * 1.7)).toFixed(1);
    
    if (bmi > 30) {
      alerts.push({
        id: `weight-high-${weight}`,
        type: 'Alert',
        title: 'Weight Concern',
        message: `Your weight indicates obesity risk (BMI: ${bmi}). Consider lifestyle changes.`,
        date: new Date().toISOString(),
        read: false,
        alertType: 'weight',
        severity: 'medium'
      });
    } else if (bmi < 18.5) {
      alerts.push({
        id: `weight-low-${weight}`,
        type: 'Alert',
        title: 'Underweight Alert',
        message: `Your weight indicates underweight condition (BMI: ${bmi}).`,
        date: new Date().toISOString(),
        read: false,
        alertType: 'weight',
        severity: 'medium'
      });
    }
  }

  return alerts;
};

// Helper: Load saved notifications
const loadSavedNotifications = async () => {
  try {
    const savedData = await AsyncStorage.getItem('notificationsState');
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error("Error loading saved notifications:", error);
  }
  return null;
};

// Helper: Load stored assessments
const loadStoredAssessments = async () => {
  try {
    const storedData = await AsyncStorage.getItem('storedAssessments');
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error("Error loading stored assessments:", error);
  }
  return [];
};

// Helper: Load system notifications
const loadSystemNotifications = async () => {
  try {
    const systemData = await AsyncStorage.getItem('systemNotifications');
    if (systemData) {
      return JSON.parse(systemData);
    }
  } catch (error) {
    console.error("Error loading system notifications:", error);
  }
  return [];
};

// Process and sync all notifications
const processNotifications = async (patientData) => {
  try {
    console.log('📄 Processing notifications in Home...');
    
    // Load existing data
    const storedAssessments = await loadStoredAssessments();
    const systemNotifications = await loadSystemNotifications();
    const savedNotifications = await loadSavedNotifications();
    
    // Generate new alerts
    const newAlerts = patientData ? generateMedicalAlerts(patientData) : [];
    
    // Use Map to ensure uniqueness
    const notificationMap = new Map();
    
    // Add saved notifications first (preserve read status)
    if (savedNotifications && savedNotifications.length > 0) {
      savedNotifications.forEach(notif => {
        notificationMap.set(notif.id, notif);
      });
    }
    
    // Process new alerts
    newAlerts.forEach(newAlert => {
      if (notificationMap.has(newAlert.id)) {
        const existing = notificationMap.get(newAlert.id);
        notificationMap.set(newAlert.id, {
          ...newAlert,
          read: existing.read
        });
      } else {
        notificationMap.set(newAlert.id, newAlert);
      }
    });
    
    // Process assessments
    storedAssessments.forEach(assessment => {
      if (notificationMap.has(assessment.id)) {
        const existing = notificationMap.get(assessment.id);
        notificationMap.set(assessment.id, {
          ...assessment,
          read: existing.read
        });
      } else {
        notificationMap.set(assessment.id, assessment);
      }
    });
    
    // Process system notifications
    systemNotifications.forEach(sysNotif => {
      if (notificationMap.has(sysNotif.id)) {
        const existing = notificationMap.get(sysNotif.id);
        notificationMap.set(sysNotif.id, {
          ...sysNotif,
          read: existing.read
        });
      } else {
        notificationMap.set(sysNotif.id, sysNotif);
      }
    });
    
    // Clean up old notifications (older than 30 days)
    const now = new Date();
    const idsToRemove = [];
    notificationMap.forEach((notif, id) => {
      const notifDate = new Date(notif.date);
      const daysDiff = (now - notifDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) {
        idsToRemove.push(id);
      }
    });
    idsToRemove.forEach(id => notificationMap.delete(id));
    
    // Convert to array and sort
    const finalNotifications = Array.from(notificationMap.values());
    finalNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save state
    await AsyncStorage.setItem('notificationsState', JSON.stringify(finalNotifications));
    
    // Update badge count
    const unreadCount = finalNotifications.filter(n => !n.read).length;
    await AsyncStorage.setItem('unreadBadgeCount', unreadCount.toString());
    
    console.log('✅ Notifications processed:', finalNotifications.length, 'Unread:', unreadCount);
    return unreadCount;
    
  } catch (error) {
    console.error('❌ Error processing notifications:', error);
    return 0;
  }
};

// ==================== END NOTIFICATION PROCESSING HELPERS ====================

export default function Home({ navigation }) {
  const { width, height } = useWindowDimensions();
  
  // Define scaling functions INSIDE the component to access width and height
  const scaleWidth = size =>
    Math.min((width / guidelineBaseWidth) * size, size * 1.25);
 
  const scaleHeight = size =>
    Math.min((height / guidelineBaseHeight) * size, size * 1.25);

  const scaleFont = size =>
    Math.min((width / guidelineBaseWidth) * size, size * 1.2);

  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("Good Morning");
  const [unreadCount, setUnreadCount] = useState(0);
  const [measurements, setMeasurements] = useState({
    bloodPressure: null,
    bloodGlucose: null,
    weight: null,
  });
  const [practiceRanges, setPracticeRanges] = useState(null);
  const [vitalsStatus, setVitalsStatus] = useState({
    bloodPressure: 'normal', // 'normal', 'high', 'low'
    bloodGlucose: 'normal',
    weight: 'normal',
  });

  // Amna Changes: Add refs to track loading state and prevent multiple simultaneous calls
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const fetchDebounceTimeoutRef = useRef(null);

  // Amna Changes: Memoize functions to prevent recreation on every render
  const setTimeBasedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
    } else if (hour < 21) {
      setGreeting("Good Evening");
    } else {
      setGreeting("Good Night");
    }
  }, []);

  // Fetch unread notifications count - SIMPLIFIED VERSION
  const fetchUnreadCount = useCallback(async () => {
    try {
      // Amna Changes: Skip if already fetching
      if (isFetchingRef.current) return;
      
      console.log('🔔 Fetching unread count...');
      
      // Get the badge count from AsyncStorage
      const savedBadgeCount = await AsyncStorage.getItem('unreadBadgeCount');
      
      if (savedBadgeCount !== null) {
        const count = parseInt(savedBadgeCount, 10);
        console.log('📊 Badge count from storage:', count);
        setUnreadCount(count);
      } else {
        console.log('⚠️ No badge count found, setting to 0');
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }, []);

  // Fetch practice ranges/thresholds
  const fetchPracticeRanges = useCallback(async (practiceId) => {
    try {
      if (!practiceId) return null;
      
      console.log('📊 Fetching practice ranges for practiceId:', practiceId);
      const rangesResult = await apiService.getPracticeRanges(practiceId);
      
      if (rangesResult && rangesResult.data) {
        const ranges = rangesResult.data.ranges || rangesResult.data;
        setPracticeRanges(ranges);
        console.log('✅ Practice ranges loaded:', ranges);
        return ranges;
      }
      return null;
    } catch (error) {
      console.log('⚠️ Could not fetch practice ranges, using defaults:', error.message);
      return null;
    }
  }, []);

  // Determine vitals status based on practice ranges
  const determineVitalsStatus = useCallback((measurements, ranges) => {
    const status = {
      bloodPressure: 'normal',
      bloodGlucose: 'normal',
      weight: 'normal',
    };

    if (!ranges) return status;

    // Blood Pressure Status
    if (measurements.bloodPressure) {
      const bp = measurements.bloodPressure;
      const systolic = parseFloat(bp.systolic_pressure || bp.systolic);
      const diastolic = parseFloat(bp.diastolic_pressure || bp.diastolic);
      
      if (!isNaN(systolic) && !isNaN(diastolic)) {
        const bpRanges = ranges.blood_pressure || {};
        const isHigh = systolic >= (bpRanges.high?.systolic?.min || 140) || 
                       diastolic >= (bpRanges.high?.diastolic?.min || 90);
        const isLow = systolic <= (bpRanges.low?.systolic?.max || 90) || 
                      diastolic <= (bpRanges.low?.diastolic?.max || 60);
        
        if (isHigh) status.bloodPressure = 'high';
        else if (isLow) status.bloodPressure = 'low';
        else status.bloodPressure = 'normal';
      }
    }

    // Blood Glucose Status
    if (measurements.bloodGlucose) {
      const glucose = parseFloat(measurements.bloodGlucose.value || measurements.bloodGlucose.blood_glucose_value_1);
      
      if (!isNaN(glucose) && glucose > 0) {
        const glucoseRanges = ranges.blood_glucose || {};
        const isHigh = glucose >= (glucoseRanges.high?.min || 126);
        const isLow = glucose <= (glucoseRanges.low?.max || 70);
        
        if (isHigh) status.bloodGlucose = 'high';
        else if (isLow) status.bloodGlucose = 'low';
        else status.bloodGlucose = 'normal';
      }
    }

    // Weight Status (based on BMI)
    if (measurements.weight) {
      const weight = parseFloat(measurements.weight.value);
      if (!isNaN(weight) && weight > 0) {
        // Assuming average height of 1.7m for BMI calculation
        // Weight is in lbs, convert to kg first: weight_lbs / 2.20462 = weight_kg
        const weightKg = weight / 2.20462;
        const bmi = weightKg / (1.7 * 1.7);
        const weightRanges = ranges.weight || {};
        const isHigh = bmi >= (weightRanges.high_bmi?.min || 30);
        const isLow = bmi <= (weightRanges.low_bmi?.max || 18.5);
        
        if (isHigh) status.weight = 'high';
        else if (isLow) status.weight = 'low';
        else status.weight = 'normal';
      }
    }

    return status;
  }, []);

  // Get color based on vitals status
  // HIGH = RED, LOW = YELLOW, NORMAL = GREEN
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'high':
        return '#EF4444'; // Red
      case 'low':
        return '#F59E0B'; // Yellow/Orange
      case 'normal':
      default:
        return '#10B981'; // Green
    }
  }, []);

  // Amna Changes: Debounced fetch function to prevent rapid consecutive calls
  const debouncedFetchPatientData = useCallback(async () => {
    // Clear any existing timeout
    if (fetchDebounceTimeoutRef.current) {
      clearTimeout(fetchDebounceTimeoutRef.current);
    }
    
    // Set a new timeout to fetch after a short delay (prevents multiple rapid calls)
    fetchDebounceTimeoutRef.current = setTimeout(async () => {
      await fetchPatientData();
    }, 300); // 300ms debounce
  }, []);

  // Function to fetch patient data and vitals from the API using getPatientDetails
  const fetchPatientData = useCallback(async () => {
    // Amna Changes: Prevent multiple simultaneous API calls
    if (isFetchingRef.current) {
      console.log('⏳ Already fetching data, skipping...');
      return null;
    }
    
    // Amna Changes: Rate limiting - don't fetch more than once every 5 seconds
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      console.log('⏳ Rate limiting: Skipping fetch, last fetch was too recent');
      return null;
    }
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    
    try {
      let practiceId = null;
      let patientId = null;
      
      // Amna Changes: Optimized AsyncStorage calls - fetch all at once
      const [userData, storedPracticeId, storedPatientId] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('practiceId'),
        AsyncStorage.getItem('patientId')
      ]);
      
      if (userData) {
        const user = JSON.parse(userData);
        practiceId = user.practice_id;
        // Use user_id (user.id) instead of patient_id string for API calls
        // The API endpoint expects numeric ID, not the patient_id string
        patientId = user.id || user.user_id; // Use user.id (user_id) as primary
        
        // If we have user.id, make sure it's stored correctly (override any old string patient_id)
        if (user.id && !isNaN(user.id)) {
          await AsyncStorage.setItem('patientId', String(user.id));
        }
      }
      
      // If not in user data, try separate storage
      if (!practiceId) {
        practiceId = storedPracticeId;
      }
      if (!patientId) {
        // Only use if it's numeric (user_id), not a string patient_id
        if (storedPatientId && !isNaN(storedPatientId) && storedPatientId !== '') {
          patientId = storedPatientId;
        } else if (storedPatientId && isNaN(storedPatientId)) {
          // Clear invalid string patient_id and fetch from API
          console.log('⚠️ Found invalid string patient_id, clearing and fetching from API...');
          await AsyncStorage.removeItem('patientId');
        }
      }
      
      // If still not found, try to fetch from API
      if (!practiceId || !patientId) {
        try {
          console.log('Fetching user data from API to get practice_id and user_id...');
          const userResult = await apiService.getCurrentUser();
          if (userResult && userResult.data) {
            const user = userResult.data.user || userResult.data;
            if (user.practice_id) {
              practiceId = String(user.practice_id);
              await AsyncStorage.setItem('practiceId', practiceId);
              // Update user data in AsyncStorage
              if (userData) {
                const parsedUser = JSON.parse(userData);
                parsedUser.practice_id = user.practice_id;
                await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
              }
            }
            // Use user.id (user_id) for API calls, not patient_id string
            if (user.id) {
              patientId = String(user.id);
              await AsyncStorage.setItem('patientId', patientId);
              // Update user data in AsyncStorage
              if (userData) {
                const parsedUser = JSON.parse(userData);
                parsedUser.id = user.id;
                await AsyncStorage.setItem('user', JSON.stringify(parsedUser));
              }
            }
          }
        } catch (apiError) {
          console.log('Could not fetch user data from API:', apiError.message);
        }
      }
      
      // Silently return null if IDs not found (don't show error)
      if (!practiceId || !patientId) {
        console.log('⚠️ Practice ID or Patient ID not found - skipping vitals fetch');
        isFetchingRef.current = false;
        return null;
      }
  
      // Use getPatientDetails endpoint which returns all latest vitals at once
      console.log('📊 Fetching patient details with latest vitals...');
      console.log('🔍 Using practiceId:', practiceId, 'patientId:', patientId);
      
      let latestMeasurements = {};
      
      try {
        const detailsResult = await apiService.getPatientDetails(practiceId, patientId);
        console.log('✅ API Response received:', JSON.stringify(detailsResult, null, 2));
        
        if (!detailsResult || !detailsResult.success) {
          console.error('❌ API returned unsuccessful response:', detailsResult);
          isFetchingRef.current = false;
          return null;
        }
        
        const patientData = detailsResult.data || detailsResult;
        const patient = patientData.patient || patientData;
        
        // Amna Changes: Parallel AsyncStorage operations
        const storagePromises = [];
        
        // Store patients_table_id for future measurement API calls
        if (patient && (patient.patients_table_id || patient.id)) {
          const patientsTableId = String(patient.patients_table_id || patient.id);
          storagePromises.push(
            AsyncStorage.setItem('patientsTableId', patientsTableId),
            AsyncStorage.setItem('patientDetails', JSON.stringify(patient))
          );
          console.log('💾 Stored patients_table_id:', patientsTableId);
        }
        
        // Execute all storage operations in parallel
        await Promise.all(storagePromises);
        
        latestMeasurements = patientData.latest_measurements || {};
        
        console.log('📋 Received latest measurements:', JSON.stringify(latestMeasurements, null, 2));
        
        if (!latestMeasurements || Object.keys(latestMeasurements).length === 0) {
          console.warn('⚠️ No measurements found in response. Patient may not have any vitals data yet.');
        }
      } catch (apiError) {
        console.error('❌ Error calling getPatientDetails API:', apiError);
        console.error('Error message:', apiError.message);
        isFetchingRef.current = false;
        return null;
      }
      
      const processedMeasurements = { 
        bloodPressure: null, 
        bloodGlucose: null, 
        weight: null 
      };
      
      // Process Blood Pressure
      if (latestMeasurements.blood_pressure) {
        console.log('✅ Found blood pressure data');
        const bp = latestMeasurements.blood_pressure;
        processedMeasurements.bloodPressure = {
          systolic_pressure: bp.systolic_pressure || '--',
          diastolic_pressure: bp.diastolic_pressure || '--',
          pulse: bp.pulse || '--',
          measure_new_date_time: bp.measure_new_date_time || bp.measure_date_time || bp.created_at || 'Recent'
        };
      }
      
      // Process Blood Glucose
      if (latestMeasurements.blood_glucose && latestMeasurements.blood_glucose !== null) {
        console.log('✅ Found blood glucose data:', JSON.stringify(latestMeasurements.blood_glucose, null, 2));
        const bg = latestMeasurements.blood_glucose;
        const bgValue = bg.blood_glucose_value_1;
        console.log('🔍 Blood glucose value_1:', bgValue, 'Type:', typeof bgValue);
        
        // Handle 0 as a valid value (0 is falsy but valid)
        const displayValue = (bgValue !== null && bgValue !== undefined && bgValue !== '') 
          ? String(bgValue) 
          : '--';
        
        processedMeasurements.bloodGlucose = {
          value: displayValue,
          measure_new_date_time: bg.measure_new_date_time || bg.measure_date_time || bg.created_at || '--'
        };
        console.log('✅ Processed blood glucose:', processedMeasurements.bloodGlucose);
      } else {
        console.log('ℹ️ No blood glucose data available. latestMeasurements.blood_glucose is:', latestMeasurements.blood_glucose);
      }
      
      // Process Weight
      if (latestMeasurements.weight && latestMeasurements.weight !== null) {
        console.log('✅ Found weight data:', JSON.stringify(latestMeasurements.weight, null, 2));
        const weight = latestMeasurements.weight;
        let weightValue = weight.weight !== null && weight.weight !== undefined ? weight.weight : (weight.weight_value || null);
        console.log('🔍 Weight value:', weightValue, 'Type:', typeof weightValue);
        
        // Handle null/undefined/empty
        if (weightValue === null || weightValue === undefined || weightValue === '') {
          weightValue = '--';
        } else {
          // Convert kg to lbs if needed (weight is typically stored in kg in database)
          const numValue = parseFloat(weightValue);
          if (!isNaN(numValue) && numValue > 0) {
            weightValue = (numValue * 2.20462).toFixed(1);
          } else {
            weightValue = String(weightValue);
          }
        }
        
        processedMeasurements.weight = {
          value: weightValue,
          measure_new_date_time: weight.measure_new_date_time || weight.measure_date_time || weight.created_at || '--',
          unit: 'lb'
        };
        console.log('✅ Processed weight:', processedMeasurements.weight);
      } else {
        console.log('ℹ️ No weight data available. latestMeasurements.weight is:', latestMeasurements.weight);
      }
  
      // Amna Changes: Update state in a batch
      setMeasurements(prev => {
        // Only update if values actually changed to prevent unnecessary re-renders
        if (JSON.stringify(prev) === JSON.stringify(processedMeasurements)) {
          return prev;
        }
        return processedMeasurements;
      });
      
      console.log('✅ Latest vitals updated:', processedMeasurements);
      
      // Fetch practice ranges if not already loaded
      if (!practiceRanges && practiceId) {
        const ranges = await fetchPracticeRanges(practiceId);
        if (ranges) {
          // Determine vitals status based on ranges
          const status = determineVitalsStatus(processedMeasurements, ranges);
          setVitalsStatus(prev => {
            if (JSON.stringify(prev) === JSON.stringify(status)) return prev;
            return status;
          });
          console.log('🎨 Vitals status determined:', status);
        }
      } else if (practiceRanges) {
        // Determine vitals status if ranges are already loaded
        const status = determineVitalsStatus(processedMeasurements, practiceRanges);
        setVitalsStatus(prev => {
          if (JSON.stringify(prev) === JSON.stringify(status)) return prev;
          return status;
        });
        console.log('🎨 Vitals status determined:', status);
      }
      
      // Amna Changes: Process notifications in background without blocking UI
      setTimeout(async () => {
        try {
          await processNotifications({ measurements: processedMeasurements, practiceId });
          await fetchUnreadCount();
        } catch (error) {
          console.error('❌ Background notification processing failed:', error);
        }
      }, 0);
      
      // Return data object for notification processing
      isFetchingRef.current = false;
      return { measurements: processedMeasurements, practiceId };
    } catch (error) {
      console.error('❌ Failed to fetch patient data:', error);
      isFetchingRef.current = false;
      return null;
    }
  }, [fetchPracticeRanges, determineVitalsStatus, fetchUnreadCount, practiceRanges]);

  // Load data on initial mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🏠 Home screen mounted, loading initial data...');
        setTimeBasedGreeting();
        
        // Amna Changes: Load user name immediately without delay
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          const fullName = parsed.first_name && parsed.last_name
            ? `${parsed.first_name} ${parsed.last_name}`
            : parsed.name || parsed.username || '';
          setUserName(fullName);
        }
        
        // Amna Changes: Fetch data immediately but don't wait for it to render UI
        // This makes the UI appear instantly
        debouncedFetchPatientData();
        
      } catch (e) {
        console.error('❌ Error loading initial data:', e);
      }
    };
    
    loadInitialData();
    
    // Amna Changes: Cleanup timeout on unmount
    return () => {
      if (fetchDebounceTimeoutRef.current) {
        clearTimeout(fetchDebounceTimeoutRef.current);
      }
    };
  }, [setTimeBasedGreeting, debouncedFetchPatientData]); // Amna Changes: Added dependencies

  // Fetch patient data and load user name when the screen comes into focus
  // Also set up polling for real-time updates
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          console.log('🏠 Home screen focused, refreshing data...');
          setTimeBasedGreeting();
          
          // Load user name
          const user = await AsyncStorage.getItem('user');
          if (user) {
            const parsed = JSON.parse(user);
            const fullName = parsed.first_name && parsed.last_name
              ? `${parsed.first_name} ${parsed.last_name}`
              : parsed.name || parsed.username || '';
            setUserName(fullName);
          }
          
          // Amna Changes: Use debounced fetch to prevent rapid calls
          debouncedFetchPatientData();
          
        } catch (e) {
          console.error('❌ Error loading data:', e);
        }
      };
      
      // Load data immediately when screen comes into focus
      loadData();
      
      // Amna Changes: Optimized polling intervals
      // - Increased intervals to reduce load
      // - Using separate intervals for different tasks
      const vitalsIntervalId = setInterval(async () => {
        console.log('🔄 Polling for vitals updates...');
        await debouncedFetchPatientData();
      }, 30000); // Amna Changes: Increased from 10 to 30 seconds for vitals updates
      
      const badgeIntervalId = setInterval(async () => {
        await fetchUnreadCount();
      }, 15000); // Amna Changes: Increased from 5 to 15 seconds for badge count
      
      // Cleanup intervals on unmount
      return () => {
        clearInterval(vitalsIntervalId);
        clearInterval(badgeIntervalId);
        if (fetchDebounceTimeoutRef.current) {
          clearTimeout(fetchDebounceTimeoutRef.current);
        }
      };
    }, [setTimeBasedGreeting, debouncedFetchPatientData, fetchUnreadCount]) // Amna Changes: Added dependencies
  );

  // Navigation handlers
  const openSummary = (type) => navigation.navigate('Summary', { chartType: type });
  const openList = (type) => navigation.navigate('DataList', { dataType: type });
  const openNotifications = () => navigation.navigate('Notifications');

  // Format date and time for display (e.g., "Nov 13, 2025 · 09:51 AM")
  const formatDateTime = useCallback((dateTimeString) => {
    if (!dateTimeString || dateTimeString === '--' || dateTimeString === 'Recent') {
      return 'Recent';
    }
    
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        return dateTimeString;
      }
      
      // Format as "MMM DD, YYYY · HH:MM AM/PM"
      const options = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      };
      return date.toLocaleDateString('en-US', options).replace(',', ' ·');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateTimeString;
    }
  }, []);

  // Format time ago (e.g., "18 days ago")
  const formatTimeAgo = useCallback((dateTimeString) => {
    if (!dateTimeString || dateTimeString === '--' || dateTimeString === 'Recent') {
      return 'Recent';
    }
    
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        return dateTimeString;
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error formatting time ago:', error);
      return dateTimeString;
    }
  }, []);

  // Render card with SWAPPED positions: "days ago" ABOVE, date/time BELOW
  // Now includes color coding: HIGH = RED, LOW = YELLOW, NORMAL = GREEN
  const renderCard = useCallback((label, data, unit, openList, openSummary, type) => {
    // Show card even if data is null (for BG and Weight when no data exists)
    // Just show "No data available" instead of hiding the card
    const hasData = data !== null && data !== undefined;
    
    // Get status for this vital type
    const status = vitalsStatus[type] || 'normal';
    const statusColor = getStatusColor(status);
    
    // Border color: Red for high, Yellow for low, Green for normal, Gray if no data
    const borderColor = hasData ? statusColor : '#E5E7EB';
    
    return (
    <View style={[
      styles(scaleWidth, scaleHeight, scaleFont).card, 
      !hasData && { opacity: 0.6 },
      { borderLeftWidth: 4, borderLeftColor: borderColor }
    ]}>
      <View style={styles(scaleWidth, scaleHeight, scaleFont).cardHeader}>
        <View style={styles(scaleWidth, scaleHeight, scaleFont).cardHeaderLeft}>
          <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardLabel}>{label}</Text>
          
          {/* Status badge for high/low readings */}
          {hasData && status !== 'normal' && (
            <View style={[styles(scaleWidth, scaleHeight, scaleFont).statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles(scaleWidth, scaleHeight, scaleFont).statusBadgeText}>
                {status === 'high' ? 'HIGH' : 'LOW'}
              </Text>
            </View>
          )}
          
          {/* "Days ago" text ABOVE value (SWAPPED POSITION) */}
          <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardTimeAgo}>
            {hasData ? formatTimeAgo(data.measure_new_date_time) : 'No data available'}
          </Text>
        </View>
      </View>
      
      <View style={styles(scaleWidth, scaleHeight, scaleFont).valueContainer}>
        <Text style={[
          styles(scaleWidth, scaleHeight, scaleFont).cardMainValue,
          hasData && status !== 'normal' && { color: statusColor }
        ]}>
          {/* Handle 0 as valid value - check for null/undefined explicitly */}
          {hasData && data?.systolic_pressure !== null && data?.systolic_pressure !== undefined 
            ? data.systolic_pressure 
            : (hasData && data?.value !== null && data?.value !== undefined && data?.value !== '' 
              ? data.value 
              : '--')}
          {hasData && data?.diastolic_pressure && (
            <Text style={[
              styles(scaleWidth, scaleHeight, scaleFont).cardSlash,
              status !== 'normal' && { color: statusColor }
            ]}>/</Text>
          )}
          {hasData && data?.diastolic_pressure && (
            <Text style={[
              styles(scaleWidth, scaleHeight, scaleFont).cardSecondValue,
              status !== 'normal' && { color: statusColor }
            ]}>{data.diastolic_pressure}</Text>
          )}
        </Text>
      </View>
      
      {/* Real date and time BELOW value (SWAPPED POSITION) */}
      <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardDateTime}>
        {hasData ? formatDateTime(data.measure_new_date_time) : 'No data available'}
      </Text>

      {/* Bottom section with UNIT on left and ICONS on right */}
      <View style={styles(scaleWidth, scaleHeight, scaleFont).cardFooter}>
        <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardUnit}>{unit}</Text>
        <View style={styles(scaleWidth, scaleHeight, scaleFont).cardActions}>
          <TouchableOpacity style={styles(scaleWidth, scaleHeight, scaleFont).cardActionButton} disabled={!hasData} onPress={() => openList(type)}>
            <View style={styles(scaleWidth, scaleHeight, scaleFont).listCircle}>
              <Image source={require('../../android/app/src/assets/images/list-icon.png')} style={styles(scaleWidth, scaleHeight, scaleFont).listIcon} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles(scaleWidth, scaleHeight, scaleFont).cardActionButton} disabled={!hasData} onPress={() => openSummary(type)}>
            <View style={[styles(scaleWidth, scaleHeight, scaleFont).chartCircle, { backgroundColor: NAVY_BLUE }]}>
              <Image source={require('../../android/app/src/assets/images/bar-chart.png')} style={styles(scaleWidth, scaleHeight, scaleFont).chartIcon} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    );
  }, [scaleWidth, scaleHeight, scaleFont, vitalsStatus, getStatusColor, formatTimeAgo, formatDateTime]);

  return (
    <SafeAreaProvider>
      {/* Set status bar style for the navy blue background */}
      <StatusBar barStyle="light-content" backgroundColor={NAVY_BLUE} />

      {/* Main container starts with light gray background */}
      <SafeAreaView style={styles(scaleWidth, scaleHeight, scaleFont).fullScreenContainer}>
        <View style={styles(scaleWidth, scaleHeight, scaleFont).mainContainer}>
          
          {/* NEW HEADER DESIGN - Like Home (2).js */}
          <View style={[styles(scaleWidth, scaleHeight, scaleFont).headerContainer, { backgroundColor: NAVY_BLUE }]}>
            <View style={styles(scaleWidth, scaleHeight, scaleFont).headerContent}>
              {/* Top row: Greeting + Notification */}
              <View style={styles(scaleWidth, scaleHeight, scaleFont).headerTopRow}>
                <Text style={styles(scaleWidth, scaleHeight, scaleFont).greetingText}>
                  {greeting}
                </Text>
                
                {/* Notification Icon */}
                <TouchableOpacity 
                  style={styles(scaleWidth, scaleHeight, scaleFont).notificationButton} 
                  onPress={openNotifications}
                  activeOpacity={0.7}
                >
                  <View style={styles(scaleWidth, scaleHeight, scaleFont).notificationIconContainer}>
                    <Image 
                      source={require('../../android/app/src/assets/images/bell.png')} 
                      style={styles(scaleWidth, scaleHeight, scaleFont).notificationImage} 
                      resizeMode="contain" 
                    />
                    
                    {/* Dynamic Notification Badge */}
                    {unreadCount > 0 && (
                      <View style={styles(scaleWidth, scaleHeight, scaleFont).notificationBadge}>
                        <Text style={styles(scaleWidth, scaleHeight, scaleFont).notificationBadgeText}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Username */}
              <Text style={styles(scaleWidth, scaleHeight, scaleFont).userNameText} numberOfLines={1}>
                {userName || 'User'}
              </Text>
            </View>
          </View>

          {/* White Cards Section */}
          <View style={styles(scaleWidth, scaleHeight, scaleFont).cardsWrapper}>
            {/* <ScrollView
              style={styles(scaleWidth, scaleHeight, scaleFont).cardsScrollView}
              contentContainerStyle={{ paddingBottom: scaleHeight(20) }}
              showsVerticalScrollIndicator={false}
            > */}
              {renderCard('Blood Pressure (bpm)', measurements.bloodPressure, 'mmHg', openList, openSummary, 'bloodPressure')}
              {renderCard('Blood Glucose (bg)', measurements.bloodGlucose, 'mg/dl', openList, openSummary, 'bloodGlucose')}
              {renderCard('Weight (wt)', measurements.weight, 'lb', openList, openSummary, 'weight')}
            {/* </ScrollView> */}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// --- Style Sheet ---
const styles = (scaleWidth, scaleHeight, scaleFont) => StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainContainer: {
    flex: 1,
  },
  
  // NEW HEADER STYLES 
  headerContainer: {
    paddingTop: scaleHeight(20),
    paddingHorizontal: scaleWidth(24),
    paddingBottom: scaleHeight(100), // Extra space for curve effect
  },
  headerContent: {
    paddingBottom: scaleHeight(10),
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(8),
  },
  greetingText: {
    fontSize: scaleFont(24),
    fontWeight: '600',
    color: 'white',
  },
  userNameText: {
    fontSize: scaleFont(18),
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: scaleHeight(-8),
  },
  notificationButton: {
    padding: scaleWidth(8),
  },
  notificationIconContainer: {
    position: 'relative',
    width: scaleWidth(28),
    height: scaleWidth(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationImage: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    tintColor: 'white',
  },
  notificationBadge: {
    position: 'absolute',
    right: scaleWidth(-4),
    top: scaleHeight(-4),
    backgroundColor: '#EF4444',
    borderRadius: scaleWidth(10),
    minWidth: scaleWidth(18),
    height: scaleWidth(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: NAVY_BLUE,
    paddingHorizontal: scaleWidth(4),
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: scaleFont(10),
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: scaleFont(11),
  },
  
  // Cards wrapper - Positioned to overlap header curve
  cardsWrapper: {
    flex: 1,
    marginTop: scaleHeight(-70), // Pull up to overlap header
    paddingHorizontal: scaleWidth(20),
  },
  // cardsScrollView: {
  //   flex: 1,
  // },
  
  // CARD STYLES
  card: {
    marginTop: scaleHeight(6),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    minHeight: scaleHeight(120),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(6),
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardLabel: {
    fontSize: scaleFont(15),
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: scaleHeight(2),
  },
  cardTimeAgo: {
    fontSize: scaleFont(11),
    color: '#999999',
    marginBottom: scaleHeight(6),
  },
  valueContainer: {
    marginBottom: scaleHeight(6),
  },
  cardMainValue: {
    fontSize: scaleFont(28),
    fontWeight: '700',
    color: NAVY_BLUE,
    lineHeight: scaleFont(32),
  },
  cardSlash: {
    fontSize: scaleFont(28),
    fontWeight: '700',
    color: NAVY_BLUE,
  },
  cardSecondValue: {
    fontSize: scaleFont(28),
    fontWeight: '700',
    color: NAVY_BLUE,
  },
  cardDateTime: {
    fontSize: scaleFont(11),
    color: '#999999',
    marginBottom: scaleHeight(4),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scaleHeight(8),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: scaleHeight(6),
  },
  cardUnit: {
    fontSize: scaleFont(11),
    color: '#666666',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionButton: {
    marginLeft: scaleWidth(10),
  },
  chartCircle: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartIcon: {
    width: scaleWidth(15),
    height: scaleWidth(15),
    tintColor: '#FFFFFF',
  },
  listCircle: {
    width: scaleWidth(32),
    height: scaleWidth(32),
    borderRadius: scaleWidth(16),
    backgroundColor: RED_ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listIcon: {
    width: scaleWidth(15),
    height: scaleWidth(15),
    tintColor: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(4),
    marginTop: scaleHeight(4),
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: scaleFont(10),
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
  },
});