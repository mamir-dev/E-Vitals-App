import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../config/globall';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scaleWidth = size => (width / guidelineBaseWidth) * size;
const scaleHeight = size => (height / guidelineBaseHeight) * size;
const scaleFont = size => scaleWidth(size);

const MAIN_THEME_COLOR = colors.primaryButton || '#293d55';
const PRIMARY_ACCENT = MAIN_THEME_COLOR;
const SECONDARY_ACCENT = colors.secondaryButton || '#D9E0F5';

// Generate unique notification IDs based on type and data
const generateNotificationId = (type, data) => {
  if (type === 'bloodPressure') {
    const systolic = data.systolic || data.systolic_pressure;
    const diastolic = data.diastolic || data.diastolic_pressure;
    return `bp-${systolic}-${diastolic}-${Date.now()}`;
  } else if (type === 'bloodGlucose') {
    const glucose = data.blood_glucose_value_1 || data.value;
    return `glucose-${glucose}-${Date.now()}`;
  } else if (type === 'weight') {
    return `weight-${data.value}-${Date.now()}`;
  }
  return `${type}-${Date.now()}`;
};

// Generate medical alerts with consistent IDs (NO timestamps for consistency)
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

// Fetch Patient Data for Real Alerts
const fetchPatientDataForAlerts = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) throw new Error('User not found');
    const user = JSON.parse(userData);
    const patientId = user.id || user.patient_id;
    if (!patientId) throw new Error('Patient ID missing');

    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Auth token missing');

    const response = await fetch(`https://evitals.life/api/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`API failed: ${response.status}`);
    const result = await response.json();
    if (!result.success || !result.data) throw new Error('Invalid response');

    return result.data;
  } catch (error) {
    console.error("Error fetching patient data for alerts:", error);
    return null;
  }
};

// Load stored assessments
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

// Load system notifications (non-hardcoded, dynamic)
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

// Notification Item Component
const NotificationItem = React.memo(({ item, onPress, onMarkAsRead }) => (
  <TouchableOpacity 
    style={[styles.notificationCard, !item.read && styles.unreadCard]}
    onPress={() => {
      onPress(item);
      onMarkAsRead(item.id);
    }}
  >
    <View style={styles.notificationTextContent}>
      <Text style={styles.notificationTitle} numberOfLines={1}>
        {item.title} - <Text style={styles.notificationType}>[{item.type}]</Text>
      </Text>
      <Text style={styles.notificationMessage} numberOfLines={2}>
        {item.message}
      </Text>
    </View>
    <Text style={styles.notificationDate}>{new Date(item.date).toLocaleDateString()}</Text>
    {!item.read && <View style={styles.unreadDot} />}
  </TouchableOpacity>
));

// Main Notifications Component
export default function Notifications({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markAllPressed, setMarkAllPressed] = useState(false);

  // Save notifications to AsyncStorage
  const saveNotificationsState = async (notificationsList) => {
    try {
      await AsyncStorage.setItem('notificationsState', JSON.stringify(notificationsList));
      console.log('✅ Saved notifications state:', notificationsList.length);
    } catch (error) {
      console.error("Error saving notifications state:", error);
    }
  };

  // Load saved notifications
  const loadSavedNotifications = async () => {
    try {
      const savedData = await AsyncStorage.getItem('notificationsState');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        console.log('📖 Loaded saved notifications:', parsed.length);
        return parsed;
      }
    } catch (error) {
      console.error("Error loading saved notifications:", error);
    }
    return null;
  };

  // Update badge count
  const updateBadgeCount = async (notificationsList) => {
    const unreadCount = notificationsList.filter(n => !n.read).length;
    await AsyncStorage.setItem('unreadBadgeCount', unreadCount.toString());
    console.log('🔔 Updated badge count:', unreadCount);
  };

  // SIMPLIFIED: Load notifications from storage (processing happens in Home.js)
  const loadRealNotifications = async () => {
    try {
      setLoading(true);
      
      // First, try to load from storage
      const savedNotifications = await loadSavedNotifications();
      
      if (savedNotifications && savedNotifications.length > 0) {
        console.log('📖 Loaded notifications from storage:', savedNotifications.length);
        savedNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotifications(savedNotifications);
      } else {
        // If no saved data, fetch fresh data and process
        console.log('⚠️ No saved notifications, fetching fresh data...');
        const patientData = await fetchPatientDataForAlerts();
        const storedAssessments = await loadStoredAssessments();
        const systemNotifications = await loadSystemNotifications();
        
        const newAlerts = patientData ? generateMedicalAlerts(patientData) : [];
        
        const notificationMap = new Map();
        
        // Process new alerts
        newAlerts.forEach(newAlert => {
          notificationMap.set(newAlert.id, newAlert);
        });
        
        // Process assessments
        storedAssessments.forEach(assessment => {
          if (!notificationMap.has(assessment.id)) {
            notificationMap.set(assessment.id, assessment);
          }
        });
        
        // Process system notifications
        systemNotifications.forEach(sysNotif => {
          if (!notificationMap.has(sysNotif.id)) {
            notificationMap.set(sysNotif.id, sysNotif);
          }
        });
        
        const finalNotifications = Array.from(notificationMap.values());
        finalNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        await saveNotificationsState(finalNotifications);
        await updateBadgeCount(finalNotifications);
        
        setNotifications(finalNotifications);
      }
      
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadRealNotifications();
      setMarkAllPressed(false);
    }, [])
  );

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId) => {
    console.log('📖 Marking as read:', notificationId);
    
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    
    setNotifications(updatedNotifications);
    await saveNotificationsState(updatedNotifications);
    await updateBadgeCount(updatedNotifications);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setMarkAllPressed(true);
    
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    setNotifications(updatedNotifications);
    await saveNotificationsState(updatedNotifications);
    await updateBadgeCount(updatedNotifications);
    
    console.log('✅ All notifications marked as read');
    
    setTimeout(() => {
      setMarkAllPressed(false);
    }, 300);
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    if (notification.type === 'Store') {
      navigation.navigate('StoreSummary', { assessmentData: notification });
      return;
    }
    
    if (notification.type === 'Alert' && notification.alertType) {
      navigation.navigate('MCQ_Agent', { 
        alertType: notification.alertType,
        notificationData: notification
      });
      return;
    }

    if (notification.type === 'System') {
      console.log('System notification clicked:', notification.id);
      return;
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !notif.read;
    return notif.type === activeFilter;
  });

  // Generate notification types with System and Alert always included (no Store)
  const uniqueTypes = [...new Set(notifications.map(n => n.type))];
  const baseTypes = ['Alert', 'System'];
  const allTypes = [...new Set([...baseTypes, ...uniqueTypes])].filter(type => type !== 'Store');
  const notificationTypes = ['All', 'Unread', ...allTypes];

  const renderItem = useCallback(({ item }) => (
    <NotificationItem 
      item={item} 
      onPress={handleNotificationPress}
      onMarkAsRead={handleMarkAsRead}
    />
  ), [notifications]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.fullScreenContainer}>
        <StatusBar backgroundColor={MAIN_THEME_COLOR} barStyle="light-content" />

        <View style={styles.mainContainer}>
          <View style={styles.topDarkSection}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Medical Alerts</Text>

              {notifications.some(n => !n.read) && (
                <TouchableOpacity 
                  style={[styles.markAllButton, markAllPressed && styles.markAllButtonPressed]}
                  onPress={handleMarkAllAsRead}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={require('../../android/app/src/assets/images/mark.png')}
                    style={styles.markAllIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.bottomLightSection}>
            <View style={styles.filterRow}>
              {notificationTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    activeFilter === type && styles.activeFilterButton,
                  ]}
                  onPress={() => setActiveFilter(type)}>
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === type && styles.activeFilterText,
                    ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>
              {activeFilter} Notifications ({filteredNotifications.length})
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading medical alerts...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredNotifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                extraData={notifications.length}
                contentContainerStyle={styles.listContentContainer}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} alerts.</Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: MAIN_THEME_COLOR,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: MAIN_THEME_COLOR,
  },
  topDarkSection: {
    backgroundColor: MAIN_THEME_COLOR,
    height: scaleHeight(95),
    borderBottomLeftRadius: scaleWidth(35),
    borderBottomRightRadius: scaleWidth(35),
    paddingBottom: scaleHeight(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(10),
  },
  backButton: {
    padding: 12, 
    justifyContent: 'center',
    alignItems: 'left',
    minHeight: 55,
    minWidth: 55,
  },
  backButtonText: {
    fontSize: scaleFont(35),
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: scaleFont(22),
    fontWeight: Platform.OS === 'ios' ? '900' : 'bold',
    color: "#ffffff",
    textAlign: 'center',
    flex: 1,
    marginLeft: scaleWidth(-20),
    ...Platform.select({
      android: {
        includeFontPadding: false,
        fontFamily: 'sans-serif-condensed',
      },
    }),
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  markAllButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: PRIMARY_ACCENT,
  },
  markAllIcon: {
    width: scaleWidth(16),
    height: scaleWidth(16),
    marginRight: scaleWidth(6),
    tintColor: 'white',
  },
  markAllText: {
    fontSize: scaleFont(12),
    color: 'white',
    fontWeight: '500',
  },
  bottomLightSection: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: scaleWidth(35),
    borderTopRightRadius: scaleWidth(35),
    marginTop: -scaleWidth(15), 
    paddingTop: scaleWidth(20), 
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(10),
    paddingBottom: scaleHeight(15),
    paddingTop: scaleHeight(5),
  },
  filterButton: {
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(6),
    borderRadius: scaleWidth(12),
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scaleWidth(3),
    marginVertical: scaleHeight(3),
    minWidth: scaleWidth(70),
  },
  activeFilterButton: {
    backgroundColor: PRIMARY_ACCENT,
    borderColor: PRIMARY_ACCENT,
  },
  filterText: {
    fontSize: scaleFont(11),
    fontWeight: '500',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: scaleFont(18), 
    fontWeight: '700',
    marginBottom: scaleHeight(10),
    paddingHorizontal: scaleWidth(20),
    color: colors.textPrimary,
    marginTop: scaleHeight(5),
    textAlign: 'left',
  },
  listContentContainer: {
    paddingHorizontal: scaleWidth(15),
    paddingBottom: scaleHeight(40),
  },
  notificationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundLight,
    borderRadius: scaleWidth(10),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: scaleWidth(4),
    borderLeftColor: SECONDARY_ACCENT,
    marginBottom: scaleHeight(10),
    position: 'relative',
  },
  unreadCard: {
    borderLeftColor: PRIMARY_ACCENT,
    backgroundColor: '#F5F8FF',
  },
  notificationTextContent: {
    flex: 1,
    marginRight: scaleWidth(10),
  },
  notificationTitle: {
    fontSize: scaleFont(14),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: scaleHeight(4),
  },
  notificationType: {
    fontSize: scaleFont(11),
    fontWeight: '400',
    color: colors.textSecondary,
  },
  notificationMessage: {
    fontSize: scaleFont(12),
    color: colors.textSecondary,
    lineHeight: scaleHeight(16),
  },
  notificationDate: {
    fontSize: scaleFont(10),
    color: colors.textSecondary,
    marginTop: scaleHeight(2),
  },
  unreadDot: {
    position: 'absolute',
    top: scaleHeight(8),
    right: scaleWidth(8),
    width: scaleWidth(6),
    height: scaleWidth(6),
    borderRadius: scaleWidth(3),
    backgroundColor: colors.danger || 'red',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: scaleHeight(50),
    paddingHorizontal: scaleWidth(20),
  },
  loadingText: {
    fontSize: scaleFont(14),
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: scaleHeight(50),
    paddingHorizontal: scaleWidth(20),
  },
  emptyText: {
    fontSize: scaleFont(14),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});