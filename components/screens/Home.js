/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, StatusBar, ScrollView 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../config/globall';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';

// Base dimensions used for scaling calculations (standard phone size)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const SECONDARY_ACCENT = colors.secondaryButton || '#FF0000';

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
    console.log('🔄 Processing notifications in Home...');
    
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

  // Define the primary color
  const PRIMARY_ACCENT = colors.primaryButton || '#3498db';
  const SECONDARY_ACCENT = colors.secondaryButton || '#FF0000';

  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("Good Morning");
  const [unreadCount, setUnreadCount] = useState(0);
  const [measurements, setMeasurements] = useState({
    bloodPressure: null,
    bloodGlucose: null,
    weight: null,
  });

  // Function to set greeting based on time of day
  const setTimeBasedGreeting = () => {
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
  };

  // Fetch unread notifications count - SIMPLIFIED VERSION
  const fetchUnreadCount = async () => {
    try {
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
  };

  // Function to fetch patient data from the API
  const fetchPatientData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        console.error('User data not found in AsyncStorage');
        return null;
      }
  
      const user = JSON.parse(userData);
      const patientId = user.id || user.patient_id;
      
      if (!patientId) {
        console.error('Patient ID not found in user data');
        return null;
      }
  
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('Auth token not found');
        return null;
      }
  
      const response = await fetch(`https://evitals.life/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        console.error(`Failed to fetch patient data: ${response.status} ${response.statusText}`);
        return null;
      }
  
      const result = await response.json();
      
      console.log('=== FULL API RESPONSE ===');
      console.log(JSON.stringify(result.data, null, 2));
      console.log('=========================');
      
      if (result.success && result.data) {
        const data = result.data;
        const processedMeasurements = { bloodPressure: null, bloodGlucose: null, weight: null };
  
        console.log('Blood Pressure data:', data.dailyTrendGraphData);
        console.log('Measurements data:', data.measurements);
        
        // Process Blood Pressure data
        if (data.measurements?.bloodPressure) {
          const bp = data.measurements.bloodPressure;
          console.log('Raw BP data from measurements:', bp);
          console.log('BP keys:', Object.keys(bp));
          
          const systolic = bp.systolic || bp.systolic_pressure || bp.systolic_value || '--';
          const diastolic = bp.diastolic || bp.diastolic_pressure || bp.diastolic_value || '--';
          const pulse = bp.pulse || bp.heart_rate || '--';
          const measureDate = bp.measure_new_date_time || bp.date || bp.measurement_date || 'Recent';
          
          processedMeasurements.bloodPressure = { 
            systolic_pressure: systolic, 
            diastolic_pressure: diastolic, 
            pulse: pulse, 
            measure_new_date_time: measureDate 
          };
          console.log('Processed BP from measurements:', processedMeasurements.bloodPressure);
        } 
        else if (data.dailyTrendGraphData) {
          const bpData = data.dailyTrendGraphData;
          console.log('BP Data from dailyTrendGraphData:', {
            systolic: bpData.systolic,
            diastolic: bpData.diastolic,
            toolTip: bpData.toolTip
          });
          
          if (bpData.systolic && bpData.systolic.length > 0) {
            const systolic = bpData.systolic[0];
            const diastolic = bpData.diastolic?.[0] || '--';
            const toolTip = bpData.toolTip?.[0] || '';
            let measureDate = 'Recent';
            if (toolTip.includes('<br>')) measureDate = toolTip.split('<br>')[0];
            processedMeasurements.bloodPressure = { 
              systolic_pressure: systolic, 
              diastolic_pressure: diastolic, 
              pulse: '--', 
              measure_new_date_time: measureDate 
            };
          }
        }
  
        // Process Blood Glucose data
        if (data.measurements?.bloodGlucose) {
          const bg = data.measurements.bloodGlucose;
          console.log('Raw BG data:', bg);
          processedMeasurements.bloodGlucose = { 
            value: bg.blood_glucose_value_1 || '--', 
            measure_new_date_time: bg.measure_new_date_time || '--' 
          };
        }
  
        // Process Weight data
        if (data.measurements?.weight) {
          const w = data.measurements.weight;
          console.log('Raw Weight data:', w);
        
          let weightValue = w.value || w.weight_value || w.weight || '--';
          const unit = (w.unit || w.measurement_unit || 'kg').toLowerCase();
          const weightDate = w.measure_new_date_time || w.date || '--';
        
          if (unit === 'kg' && weightValue !== '--') {
            weightValue = (parseFloat(weightValue) * 2.20462).toFixed(1);
            console.log(`Converted ${weightValue} kg → ${weightValue} lb`);
          }
        
          processedMeasurements.weight = { 
            value: weightValue, 
            measure_new_date_time: weightDate,
            unit: unit === 'kg' ? 'lb' : unit
          };
        
          console.log('Processed Weight (converted):', processedMeasurements.weight);
        }
  
        setMeasurements(processedMeasurements);
        console.log('Final measurements:', processedMeasurements);
        
        // Return the complete data object for notification processing
        return { ...data, measurements: processedMeasurements };
      } else {
        console.error('API response indicates failure:', result);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
      return null;
    }
  };

  // Fetch patient data and load user name when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          console.log('🏠 Home screen focused, loading data...');
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
          
          // **CRITICAL FIX**: Fetch patient data FIRST
          const patientData = await fetchPatientData();
          
          // **CRITICAL FIX**: Process notifications with fresh patient data
          if (patientData) {
            await processNotifications(patientData);
          }
          
          // **CRITICAL FIX**: Now fetch badge count (it's been updated by processNotifications)
          await fetchUnreadCount();
          
        } catch (e) {
          console.error('❌ Error loading data:', e);
        }
      };
      
      loadData();
      
      // Refresh badge count every 5 seconds while screen is focused
      const intervalId = setInterval(async () => {
        await fetchUnreadCount();
      }, 5000);
      
      // Cleanup interval on unmount
      return () => {
        clearInterval(intervalId);
      };
    }, [])
  );

  // Navigation handlers
  const openSummary = (type) => navigation.navigate('Summary', { chartType: type });
  const openList = (type) => navigation.navigate('DataList', { dataType: type });
  const openNotifications = () => navigation.navigate('Notifications');

  // Format date and time for display (e.g., "Nov 13, 2025 · 09:51 AM")
  const formatDateTime = (dateTimeString) => {
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
  };

  // Format time ago (e.g., "18 days ago")
  const formatTimeAgo = (dateTimeString) => {
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
  };

  // Render card with SWAPPED positions: "days ago" ABOVE, date/time BELOW
  const renderCard = (label, data, unit, openList, openSummary, type) => (
    <View style={[styles(scaleWidth, scaleHeight, scaleFont).card, !data && { opacity: 0.5 }]}>
      <View style={styles(scaleWidth, scaleHeight, scaleFont).cardHeader}>
        <View style={styles(scaleWidth, scaleHeight, scaleFont).cardHeaderLeft}>
          <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardLabel}>{label}</Text>
          
          {/* "Days ago" text ABOVE value (SWAPPED POSITION) */}
          <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardTimeAgo}>
            {data ? formatTimeAgo(data.measure_new_date_time) : 'No data available'}
          </Text>
        </View>
      </View>
      
      <View style={styles(scaleWidth, scaleHeight, scaleFont).valueContainer}>
        <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardMainValue}>
          {data?.value || data?.systolic_pressure || '--'}
          {data?.diastolic_pressure && <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardSlash}>/</Text>}
          {data?.diastolic_pressure && <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardSecondValue}>{data.diastolic_pressure}</Text>}
        </Text>
      </View>
      
      {/* Real date and time BELOW value (SWAPPED POSITION) */}
      <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardDateTime}>
        {data ? formatDateTime(data.measure_new_date_time) : 'No data'}
      </Text>

      {/* Bottom section with UNIT on left and ICONS on right */}
      <View style={styles(scaleWidth, scaleHeight, scaleFont).cardFooter}>
        <Text style={styles(scaleWidth, scaleHeight, scaleFont).cardUnit}>{unit}</Text>
        <View style={styles(scaleWidth, scaleHeight, scaleFont).cardActions}>
          <TouchableOpacity style={styles(scaleWidth, scaleHeight, scaleFont).cardActionButton} disabled={!data} onPress={() => openList(type)}>
            <View style={styles(scaleWidth, scaleHeight, scaleFont).listCircle}>
              <Image source={require('../../android/app/src/assets/images/list-icon.png')} style={styles(scaleWidth, scaleHeight, scaleFont).listIcon} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles(scaleWidth, scaleHeight, scaleFont).cardActionButton} disabled={!data} onPress={() => openSummary(type)}>
            <View style={[styles(scaleWidth, scaleHeight, scaleFont).chartCircle, { backgroundColor: PRIMARY_ACCENT }]}>
              <Image source={require('../../android/app/src/assets/images/bar-chart.png')} style={styles(scaleWidth, scaleHeight, scaleFont).chartIcon} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      {/* Set status bar style for the blue background */}
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_ACCENT} />

      {/* Main container starts with the white background */}
      <SafeAreaView style={styles(scaleWidth, scaleHeight, scaleFont).fullScreenContainer}>
        <View style={styles(scaleWidth, scaleHeight, scaleFont).mainContainer}>
          
          {/* Header Section with Blue Background and prominent Bottom Curves (Greeting Logic) */}
          <View style={[styles(scaleWidth, scaleHeight, scaleFont).blueHeaderContainer, { backgroundColor: PRIMARY_ACCENT }]}>
            <View style={styles(scaleWidth, scaleHeight, scaleFont).headerRow}>
              <View style={styles(scaleWidth, scaleHeight, scaleFont).nameContainer}>
                {/* Greeting + Hi Icon on same line */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles(scaleWidth, scaleHeight, scaleFont).greetingText, { color: 'white' }]}>{greeting}</Text>
                  <Image
                    source={require('../../android/app/src/assets/images/hi.png')}
                    style={{ width: 40, height: 40, marginLeft: 2, tintColor: 'white' }}
                    resizeMode="contain"
                  />
                </View>

                {/* User name */}
                <Text style={styles(scaleWidth, scaleHeight, scaleFont).userName} numberOfLines={1} ellipsizeMode="tail">
                  {userName}
                </Text>
              </View>

              {/* Notification Icon */}
              <TouchableOpacity 
                style={styles(scaleWidth, scaleHeight, scaleFont).notificationIcon} 
                onPress={openNotifications}
                activeOpacity={0.7}
              >
                <View style={styles(scaleWidth, scaleHeight, scaleFont).notificationIconContainer}>
                  <Image 
                    source={require('../../android/app/src/assets/images/bell.png')} 
                    style={[styles(scaleWidth, scaleHeight, scaleFont).notificationImage, { tintColor: 'white' }]} 
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
          </View>
          
          {/* Last Upload Data (Outside the blue background) */}
          <View style={styles(scaleWidth, scaleHeight, scaleFont).sectionTitleContainer}>
            <Text style={styles(scaleWidth, scaleHeight, scaleFont).sectionTitle}>Last Upload Data</Text>
          </View>

          {/* Cards Section */}
          <ScrollView
            style={styles(scaleWidth, scaleHeight, scaleFont).cardsSection}
            contentContainerStyle={{ paddingBottom: scaleHeight(20) }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles(scaleWidth, scaleHeight, scaleFont).dataCardsContainer}>
              {renderCard('Blood Pressure (bpm)', measurements.bloodPressure, 'mmHg', openList, openSummary, 'bloodPressure')}
              {renderCard('Blood Glucose (bg)', measurements.bloodGlucose, 'mg/dl', openList, openSummary, 'bloodGlucose')}
              {renderCard('Weight (wt)', measurements.weight, 'lb', openList, openSummary, 'weight')}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// --- Style Sheet ---
const styles = (scaleWidth, scaleHeight, scaleFont) => StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  mainContainer: {
    flex: 1,
  },
  blueHeaderContainer: {
    paddingTop: scaleHeight(10),
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(30),
  },
  sectionTitleContainer: {
    backgroundColor: 'white',
    paddingHorizontal: scaleWidth(20),
    marginTop: scaleHeight(-20),
    paddingTop: scaleHeight(15),
    paddingBottom: scaleHeight(5),
    borderTopLeftRadius: scaleWidth(25),
    borderTopRightRadius: scaleWidth(25),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(12),
  },
  nameContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: scaleFont(28),
    fontWeight: 'bold',
    marginBottom: scaleHeight(2),
  },
  userName: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: 'white',
  },
  notificationIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleHeight(5),
  },
  notificationIconContainer: {
    position: 'relative',
    width: scaleWidth(30),
    height: scaleWidth(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationImage: {
    width: scaleWidth(24),
    height: scaleWidth(24),
  },
  notificationBadge: {
    position: 'absolute',
    right: scaleWidth(-4),
    top: scaleHeight(-6),
    backgroundColor: '#EF4444',
    borderRadius: scaleWidth(10),
    minWidth: scaleWidth(18),
    height: scaleWidth(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    paddingHorizontal: scaleWidth(4),
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: scaleFont(10),
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: scaleFont(11),
  },
  sectionTitle: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardsSection: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(10),
  },
  dataCardsContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(14),
    marginBottom: scaleHeight(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    minHeight: scaleHeight(110),
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: scaleHeight(5),
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardLabel: {
    fontSize: scaleFont(15),
    fontWeight: '400',
    color: '#000000',
    marginBottom: scaleHeight(2),
  },
  cardTimeAgo: {
    fontSize: scaleFont(10),
    color: '#999999',
    marginBottom: scaleHeight(5),
  },
  valueContainer: {
    marginBottom: scaleHeight(4),
  },
  cardMainValue: {
    fontSize: scaleFont(26),
    fontWeight: '700',
    color: '#293d55',
    lineHeight: scaleFont(30),
  },
  cardSlash: {
    fontSize: scaleFont(26),
    fontWeight: '700',
    color: '#293d55',
  },
  cardSecondValue: {
    fontSize: scaleFont(26),
    fontWeight: '700',
    color: '#293d55',
  },
  cardDateTime: {
    fontSize: scaleFont(10),
    color: '#999999',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scaleHeight(5),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: scaleHeight(6),
  },
  cardUnit: {
    fontSize: scaleFont(10),
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionButton: {
    marginLeft: scaleWidth(8),
  },
  chartCircle: {
    width: scaleWidth(30),
    height: scaleWidth(30),
    borderRadius: scaleWidth(15),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  chartIcon: {
    width: scaleWidth(14),
    height: scaleWidth(14),
    tintColor: colors.textWhite,
  },
  listCircle: {
    width: scaleWidth(30),
    height: scaleWidth(30),
    borderRadius: scaleWidth(15),
    backgroundColor: SECONDARY_ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  listIcon: {
    width: scaleWidth(14),
    height: scaleWidth(14),
    tintColor: colors.textWhite,
  },
});