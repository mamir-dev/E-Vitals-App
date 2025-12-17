/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, StatusBar 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../config/globall';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Get current screen dimensions
const { width, height } = Dimensions.get('window');
// Base dimensions used for scaling calculations (standard phone size)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// --- RESPONSIVE SCALING FUNCTIONS ---
const scaleWidth = size => (width / guidelineBaseWidth) * size;
const scaleHeight = size => (height / guidelineBaseHeight) * size;
const scaleFont = size => scaleWidth(size);

// Define the primary color
const PRIMARY_ACCENT = colors.primaryButton || '#3498db';
const SECONDARY_ACCENT = colors.secondaryButton || '#FF0000';

export default function Home({ navigation }) {
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
        return;
      }
  
      const user = JSON.parse(userData);
      const patientId = user.id || user.patient_id;
      
      if (!patientId) {
        console.error('Patient ID not found in user data');
        return;
      }
  
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('Auth token not found');
        return;
      }
  
      const response = await fetch(`https://evitals.life/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        console.error(`Failed to fetch patient data: ${response.status} ${response.statusText}`);
        return;
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
      } else {
        console.error('API response indicates failure:', result);
      }
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
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
        
        // Fetch patient data
        await fetchPatientData();
        
        // Fetch badge count
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
    <View style={[styles.card, !data && { opacity: 0.5 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardLabel}>{label}</Text>
          
          {/* "Days ago" text ABOVE value (SWAPPED POSITION) */}
          <Text style={styles.cardTimeAgo}>
            {data ? formatTimeAgo(data.measure_new_date_time) : 'No data available'}
          </Text>
        </View>
        {/* REMOVED: <Text style={styles.chevron}>›</Text> */}
      </View>
      
      <View style={styles.valueContainer}>
        <Text style={styles.cardMainValue}>
          {data?.value || data?.systolic_pressure || '--'}
          {data?.diastolic_pressure && <Text style={styles.cardSlash}>/</Text>}
          {data?.diastolic_pressure && <Text style={styles.cardSecondValue}>{data.diastolic_pressure}</Text>}
        </Text>
      </View>
      
      {/* Real date and time BELOW value (SWAPPED POSITION) */}
      <Text style={styles.cardDateTime}>
        {data ? formatDateTime(data.measure_new_date_time) : 'No data'}
      </Text>

      {/* Bottom section with UNIT on left and ICONS on right */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardUnit}>{unit}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.cardActionButton} disabled={!data} onPress={() => openList(type)}>
            <View style={styles.listCircle}>
              <Image source={require('../../android/app/src/assets/images/list-icon.png')} style={styles.listIcon} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardActionButton} disabled={!data} onPress={() => openSummary(type)}>
            <View style={[styles.chartCircle, { backgroundColor: PRIMARY_ACCENT }]}>
              <Image source={require('../../android/app/src/assets/images/bar-chart.png')} style={styles.chartIcon} />
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
      <SafeAreaView style={styles.fullScreenContainer}>
        <View style={styles.mainContainer}>
          
          {/* Header Section with Blue Background and prominent Bottom Curves (Greeting Logic) */}
          <View style={styles.blueHeaderContainer}>
            <View style={styles.headerRow}>
              <View style={styles.nameContainer}>
                {/* Greeting + Hi Icon on same line */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Text color changed to white for contrast on blue background */}
                <Text style={[styles.greetingText, { color: 'white' }]}>{greeting}</Text>
                <Image
                  source={require('../../android/app/src/assets/images/hi.png')}
                  // Tint color changed to white for contrast on blue background
                  style={{ width: 40, height: 40, marginLeft: 2, tintColor: 'white' }}
                  resizeMode="contain"
                />
                </View>

                {/* Text color changed to white for contrast on blue background */}
                <Text style={[styles.userName, { color: 'white' }]}>{userName}</Text>
              </View>

              {/* Notification Icon */}
              <TouchableOpacity 
                style={styles.notificationIcon} 
                onPress={openNotifications}
                activeOpacity={0.7}
              >
                <View style={styles.notificationIconContainer}>
                  <Image 
                    source={require('../../android/app/src/assets/images/bell.png')} 
                    // Tint color changed to white for contrast on blue background
                    style={[styles.notificationImage, { tintColor: 'white' }]} 
                    resizeMode="contain" 
                  />
                  
                  {/* Dynamic Notification Badge */}
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Last Upload Data (Outside the blue background) */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Last Upload Data</Text>
          </View>


          {/* Cards Section */}
          <View style={styles.cardsSection}>
            <View style={styles.dataCardsContainer}>
              {renderCard('Blood Pressure (bpm)', measurements.bloodPressure, 'mmHg', openList, openSummary, 'bloodPressure')}
              {renderCard('Blood Glucose (bg)', measurements.bloodGlucose, 'mg/dl', openList, openSummary, 'bloodGlucose')}
              {renderCard('Weight (wt)', measurements.weight, 'lb', openList, openSummary, 'weight')}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// --- Style Sheet ---
const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'white', // Ensure the background under the card section is white
  },
  mainContainer: {
    flex: 1,
  },

  // NEW STYLE for the curved blue header (only includes greeting/notification)
  blueHeaderContainer: {
    backgroundColor: PRIMARY_ACCENT,
    // Increased radius for a more prominent, smooth curve like the reference image
    // borderBottomLeftRadius: scaleWidth(20), 
    // borderBottomRightRadius: scaleWidth(20),
    paddingTop: scaleHeight(20),
    paddingHorizontal: scaleWidth(20),
    paddingBottom: scaleHeight(30), // Increased bottom padding to accommodate the larger curve
  },
  
  // Container for the title outside the blue header
  // sectionTitleContainer: {
  //   backgroundColor: 'white', // Explicitly white background
  //   paddingHorizontal: scaleWidth(20),
  //   // Use negative margin to visually position the title correctly relative to the curve
  //   marginTop: scaleHeight(-20), 
  //   paddingTop: scaleHeight(15),
  //   paddingBottom: scaleHeight(5),
  // },
  sectionTitleContainer: {
  backgroundColor: 'white',
  paddingHorizontal: scaleWidth(20),
  marginTop: scaleHeight(-20),
  paddingTop: scaleHeight(15),
  paddingBottom: scaleHeight(5),

  //  ADD THESE
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

  // Cards section
  cardsSection: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(10),
  },
  dataCardsContainer: {
    flex: 1,
  },

  // ======== CARD (SLIGHTLY SMALLER) ========
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(10),   // Slightly reduced
    paddingHorizontal: scaleWidth(14),  // Slightly reduced
    marginBottom: scaleHeight(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    minHeight: scaleHeight(110),        // Slightly smaller
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

  // Main BP / Glucose / Weight values
  cardMainValue: {
    fontSize: scaleFont(26),     // Slightly reduced
    fontWeight: '700',
    color: '#11224D',
    lineHeight: scaleFont(30),
  },
  cardSlash: {
    fontSize: scaleFont(26),
    fontWeight: '700',
    color: '#11224D',
  },
  cardSecondValue: {
    fontSize: scaleFont(26),
    fontWeight: '700',
    color: '#11224D',
  },

  // Date under value
  cardDateTime: {
    fontSize: scaleFont(10),
    color: '#999999',
  },

  // Footer — Unit + Icons
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

  // Icons slightly smaller
  chartCircle: {
    width: scaleWidth(30),     
    height: scaleWidth(30),
    borderRadius: scaleWidth(15),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    backgroundColor: PRIMARY_ACCENT,
  },
  chartIcon: {
    width: scaleWidth(14),     // 15 → 14
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