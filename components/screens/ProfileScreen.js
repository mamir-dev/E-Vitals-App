import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../config/globall';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Get screen width and height
const { width, height } = Dimensions.get('window');

// Set base design sizes for responsive scaling
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Functions to make design responsive
const scaleWidth = size => (width / guidelineBaseWidth) * size;
const scaleHeight = size => (height / guidelineBaseHeight) * size;
const scaleFont = size => scaleWidth(size);

// Define colors for UI
const NAVY_BLUE = colors.primaryButton || '#11224D';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F4F7F9';

const PatientProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: "Loading...",
    email: "Loading...",
    phone: "Loading...",
    dob: "Loading...",
    address: "Loading...",
  });

  const [medicalTeam, setMedicalTeam] = useState({
    practice: "Loading...",
    practice_id: null,
    provider: "Loading...",
    provider_id: null,
    caregiver: "Loading..."
  });

  const [isLoading, setIsLoading] = useState(true);

  // Helper function to safely convert values to strings
  const safeString = (value, fallback = 'Not provided') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value.trim() || fallback;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      // If it's an object, try to extract a meaningful string
      if (value.name) return String(value.name);
      if (value.first_name && value.last_name) return `${value.first_name} ${value.last_name}`.trim();
      if (value.firstName && value.lastName) return `${value.firstName} ${value.lastName}`.trim();
      // If we can't extract a meaningful value, return fallback
      return fallback;
    }
    return String(value) || fallback;
  };

  // Fetch patient data from API
  const fetchPatientData = async () => {
      try {
        setIsLoading(true);
      
      // Get user data from AsyncStorage to get patient ID
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        console.error('User data not found in AsyncStorage');
        Alert.alert("Error", "User data not found. Please login again.");
        setIsLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const patientId = user.id || user.patient_id;
      
      if (!patientId) {
        console.error('Patient ID not found in user data');
        Alert.alert("Error", "Patient ID not found. Please login again.");
        setIsLoading(false);
        return;
      }

      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('Auth token not found');
        Alert.alert("Error", "Authentication token not found. Please login again.");
        setIsLoading(false);
        return;
      }

      // Fetch patient data from API
      const response = await fetch(`https://evitals.life/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch patient data: ${response.status} ${response.statusText}`);
        Alert.alert("Error", `Failed to fetch patient data: ${response.status}`);
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      
      // Log the full response for debugging
      console.log('=== PROFILE API RESPONSE ===');
      console.log(JSON.stringify(result.data, null, 2));
      console.log('=== KEY FIELDS ===');
      console.log('Practice:', result.data?.practice, 'Practice ID:', result.data?.practice_id);
      console.log('Provider:', result.data?.provider, 'Provider ID:', result.data?.provider_id);
      console.log('Date of Birth (root):', result.data?.date_of_birth);
      console.log('Address (root):', result.data?.address);
      console.log('Patient Model:', result.data?.patient_model);
      const patientUser = result.data?.patient?.patient_user || result.data?.patient?.patientUser;
      console.log('Patient User exists:', !!patientUser);
      console.log('Patient User DOB:', patientUser?.date_of_birth);
      console.log('Patient User City:', patientUser?.city);
      console.log('Patient User State:', patientUser?.state);
      console.log('Patient User Zip:', patientUser?.zip_code);
      console.log('Patient User Practice ID:', patientUser?.practice_id);
      console.log('Patient User Provider ID:', patientUser?.provider_id);
      console.log('===========================');
      
      if (result.success && result.data) {
        const data = result.data;
        const patient = data.patient || data;
        const patientModel = data.patient_model || {};
        
        // Extract patient information - check patient_model first, then patient, then data
        const firstName = patientModel.first_name || patient.first_name || patient.firstName || '';
        const lastName = patientModel.last_name || patient.last_name || patient.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || patient.name || patient.username || 'Not provided';
        
        // Format date of birth if available - check patient_model, root level, patient_user, and patient object
        let dobFormatted = 'Not provided';
        const patientUser = patient.patient_user || patient.patientUser;
        // Check patient_user first since that's where the data is
        const dobDate = (patientUser && patientUser.date_of_birth) || 
                       patientModel.date_of_birth || 
                       data.date_of_birth || 
                       patient.dob || 
                       patient.date_of_birth || 
                       patient.birth_date;
        if (dobDate) {
          try {
            const date = new Date(dobDate);
            if (!isNaN(date.getTime())) {
              dobFormatted = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
            } else {
              dobFormatted = String(dobDate);
            }
          } catch (e) {
            dobFormatted = String(dobDate);
          }
        }
        
        // Format address if available - check patient_model, root level, patient_user, and patient object
        let addressFormatted = 'Not provided';
        // First try to build from patient_user fields (this is where the data is)
        if (patientUser && (patientUser.address || patientUser.city || patientUser.state || patientUser.zip_code)) {
          const addrParts = [
            patientUser.address,
            patientUser.city,
            patientUser.state,
            patientUser.zip_code
          ].filter(Boolean);
          addressFormatted = addrParts.length > 0 ? addrParts.join(', ') : 'Not provided';
        } else if (patientModel.address || patientModel.city || patientModel.state || patientModel.zip_code) {
          // Try to build from patient_model fields
          const addrParts = [
            patientModel.address,
            patientModel.city,
            patientModel.state,
            patientModel.zip_code
          ].filter(Boolean);
          addressFormatted = addrParts.length > 0 ? addrParts.join(', ') : 'Not provided';
        } else {
          // Fallback to other locations
          const addressData = data.address || patient.address;
          if (addressData) {
            if (typeof addressData === 'string') {
              addressFormatted = addressData;
            } else if (typeof addressData === 'object') {
              // If address is an object, format it
              const addrParts = [
                addressData.street || addressData.address_line_1,
                addressData.city,
                addressData.state || addressData.STATE_NAME,
                addressData.zip || addressData.zip_code || addressData.postal_code
              ].filter(Boolean);
              addressFormatted = addrParts.length > 0 ? addrParts.join(', ') : 'Not provided';
            }
          }
        }
        
        // Update user data state - ensure all values are strings
        // Check patient_model first, then patient, then data
        const patientEmail = patientModel.email || patient.email || data.email || 'Not provided';
        const patientPhone = patientModel.phone_number || patientModel.cell_phone_number || 
                           patient.phone || patient.mobile_number || patient.phone_number || 
                           patient.cell_phone_number || data.phone || 'Not provided';
        
        setUserData({
          name: safeString(fullName, 'Not provided'),
          email: safeString(patientEmail, 'Not provided'),
          phone: safeString(patientPhone, 'Not provided'),
          dob: safeString(dobFormatted, 'Not provided'),
          address: safeString(addressFormatted, 'Not provided'),
        });

        // Extract medical team information
        // API now returns practice_name and provider name directly in data.practice and data.provider
        // Also get IDs for reference
        const practiceId = data.practice_id || (patientUser ? patientUser.practice_id : null);
        const providerId = data.provider_id || (patientUser ? patientUser.provider_id : null);
        
        // Get practice name - API returns practice_name from practices table
        let practice = data.practice;
        
        // If practice is still a number (ID), it means backend hasn't been updated
        if (typeof practice === 'number') {
          console.warn('Backend returned Practice ID instead of name. ID:', practice);
          console.warn('Backend should return practice name. Check if backend code is deployed.');
          practice = null;
        }
        
        // If practice is null/empty, show "Not assigned"
        practice = safeString(practice, 'Not assigned');
        
        // Get provider name - API returns provider name (first_name + last_name) from users table
        let provider = data.provider;
        
        // If provider is still a number (ID), it means backend hasn't been updated
        if (typeof provider === 'number') {
          console.warn('Backend returned Provider ID instead of name. ID:', provider);
          console.warn('Backend should return provider name. Check if backend code is deployed.');
          provider = null;
        }
        
        // If provider is null/empty, show "Not assigned"
        provider = safeString(provider, 'Not assigned');
        
        // Log extracted medical team data for debugging
        console.log('=== MEDICAL TEAM EXTRACTED ===');
        console.log('Practice Name:', practice, '(Practice ID:', practiceId, ')');
        console.log('Provider Name:', provider, '(Provider ID:', providerId, ')');
        console.log('================================');
        
        // Extract caregiver information from the response structure
        // The API returns caregiver as an array, and each item has a caregivers array
        let caregiver = null;
        
        // Check if data.caregiver is an array (as shown in API response)
        if (data.caregiver && Array.isArray(data.caregiver) && data.caregiver.length > 0) {
          const firstCaregiverItem = data.caregiver[0];
          // Check if this item has a caregivers array
          if (firstCaregiverItem.caregivers && Array.isArray(firstCaregiverItem.caregivers) && firstCaregiverItem.caregivers.length > 0) {
            const caregiverUser = firstCaregiverItem.caregivers[0];
            const firstName = caregiverUser.first_name || '';
            const lastName = caregiverUser.last_name || '';
            caregiver = `${firstName} ${lastName}`.trim() || caregiverUser.name || caregiverUser.username;
          }
        }
        
        // Fallback to other possible locations
        if (!caregiver && data.caregivers && Array.isArray(data.caregivers) && data.caregivers.length > 0) {
          const firstCaregiver = data.caregivers[0];
          const firstName = firstCaregiver.first_name || '';
          const lastName = firstCaregiver.last_name || '';
          caregiver = `${firstName} ${lastName}`.trim() || firstCaregiver.name || firstCaregiver.caregiver_name || firstCaregiver.username;
        }
        
        if (!caregiver && data.caregiver_name) {
          caregiver = data.caregiver_name;
        }
        
        if (!caregiver && patient.caregiver) {
          if (typeof patient.caregiver === 'object') {
            const firstName = patient.caregiver.first_name || '';
            const lastName = patient.caregiver.last_name || '';
            caregiver = `${firstName} ${lastName}`.trim() || patient.caregiver.name;
          } else {
            caregiver = patient.caregiver;
          }
        }
        
        if (!caregiver && data.caregiver_info) {
          const firstName = data.caregiver_info.first_name || '';
          const lastName = data.caregiver_info.last_name || '';
          caregiver = `${firstName} ${lastName}`.trim() || data.caregiver_info.name;
        }
        
        caregiver = safeString(caregiver, 'N/A (No caregiver assigned)');
        
        setMedicalTeam({
          practice,
          practice_id: practiceId,
          provider,
          provider_id: providerId,
          caregiver
        });

        // Also update AsyncStorage with the fetched data for offline access
        await AsyncStorage.setItem('user', JSON.stringify({
          ...user,
          ...patient,
          first_name: firstName,
          last_name: lastName,
          email: patient.email || user.email,
          phone: patient.phone || patient.mobile_number || patient.phone_number || patient.cell_phone_number || user.phone,
          dob: dobDate || patient.dob || patient.date_of_birth || user.dob,
          date_of_birth: dobDate || patient.date_of_birth || user.date_of_birth,
          address: addressFormatted !== 'Not provided' ? addressFormatted : (user.address || null)
        }));

        // Store medical team data in AsyncStorage
        await AsyncStorage.setItem('medical_team', JSON.stringify({
          practice,
          practice_id: practiceId,
          provider,
          provider_id: providerId,
          caregiver
        }));

      } else {
        console.error('API response indicates failure:', result);
        // Fallback to AsyncStorage data if API fails
        await loadFromAsyncStorage();
      }
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
      // Fallback to AsyncStorage data if API fails
      await loadFromAsyncStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback function to load data from AsyncStorage
  const loadFromAsyncStorage = async () => {
    try {
      // Load user data from AsyncStorage
        const user = await AsyncStorage.getItem("user");
        if (user) {
          const parsed = JSON.parse(user);
        const fullName = `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim() || parsed.name || parsed.username || 'Not provided';
          setUserData({
          name: safeString(fullName, 'Not provided'),
          email: safeString(parsed.email, 'Not provided'),
          phone: safeString(parsed.phone || parsed.mobile_number || parsed.phone_number || parsed.cell_phone_number, 'Not provided'),
          dob: safeString(parsed.dob || parsed.date_of_birth, 'Not provided'),
          address: safeString(parsed.address, 'Not provided'),
        });
      }

      // Load medical team data from AsyncStorage
        const medicalData = await AsyncStorage.getItem("medical_team");
        if (medicalData) {
          const parsedMedical = JSON.parse(medicalData);
          setMedicalTeam({
          practice: safeString(parsedMedical.practice, 'Not assigned'),
          practice_id: parsedMedical.practice_id || null,
          provider: safeString(parsedMedical.provider, 'Not assigned'),
          provider_id: parsedMedical.provider_id || null,
          caregiver: safeString(parsedMedical.caregiver, 'N/A (No caregiver assigned)')
        });
      }
      } catch (e) {
      console.error("Failed to load data from AsyncStorage:", e);
      }
    };
    
  // Load user data when component mounts
  useEffect(() => {
    fetchPatientData();
  }, []);

  // Custom component for the Read-Only Info Fields
  const InfoField = ({ label, value }) => {
    // Ensure value is always a string
    const displayValue = safeString(value, 'Not provided');
    return (
    <View style={styles.infoFieldContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.readOnlyText}>{displayValue}</Text>
    </View>
  );
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.fullScreenContainer}>
          <StatusBar backgroundColor={NAVY_BLUE} barStyle="light-content" />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading patient data...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.fullScreenContainer}>
        {/* Status Bar */}
        {/* <StatusBar backgroundColor={NAVY_BLUE} barStyle="light-content" /> */}
        <StatusBar barStyle="default" />

        
        <View style={styles.mainContainer}>
          {/* Header - Navy Blue Bar */}
          <View style={styles.topDarkSection}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('Home')} // Navigate directly to Home
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* White section (Body section) */}
          <View style={styles.bottomLightSection}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              
              {/* Profile Section - Image and Name */}
              <View style={styles.profileSection}>
                <View style={styles.profileImageContainer}>
                  <Image
                    source={require('../../android/app/src/assets/images/profile1.png')}
                    style={[
                      styles.profileImage,
                      { borderColor: NAVY_BLUE, borderWidth: scaleWidth(3) } 
                    ]}
                    resizeMode="cover"
                  />
                </View>
                
                {/* User Name displayed prominently below image */}
                <Text style={styles.userNameDisplay}>{safeString(userData.name, 'Not provided')}</Text>
              </View>

              {/* Patient Details Section */}
              <View style={styles.patientDetailsSection}>
                <Text style={styles.sectionTitle}>Patient Details</Text>
                
                <InfoField label="Name" value={userData.name} />
                <InfoField label="Date of Birth" value={userData.dob} />
                <InfoField label="Address" value={userData.address} />
                <InfoField label="Email" value={userData.email} />
                <InfoField label="Phone" value={userData.phone} />
              </View>

              {/* Divider Line */}
              <View style={styles.divider} />

              {/* Medical Team Section */}
              <View style={styles.medicalTeamSection}>
                <Text style={styles.sectionTitle}>Medical Team</Text>
                
                <View style={styles.medicalTeamContainer}>
                  <View style={styles.medicalTeamRow}>
                    <Text style={styles.medicalTeamLabel}>Practice:</Text>
                    <View style={styles.medicalTeamValueContainer}>
                      <Text style={styles.medicalTeamValue}>{safeString(medicalTeam.practice, 'Not assigned')}</Text>
                      {medicalTeam.practice_id && (
                        <Text style={styles.medicalTeamId}>(ID: {medicalTeam.practice_id})</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.medicalTeamRow}>
                    <Text style={styles.medicalTeamLabel}>Provider:</Text>
                    <View style={styles.medicalTeamValueContainer}>
                      <Text style={styles.medicalTeamValue}>{safeString(medicalTeam.provider, 'Not assigned')}</Text>
                      {medicalTeam.provider_id && (
                        <Text style={styles.medicalTeamId}>(ID: {medicalTeam.provider_id})</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.medicalTeamRow}>
                    <Text style={styles.medicalTeamLabel}>Caregiver:</Text>
                    <Text style={styles.medicalTeamValue}>{safeString(medicalTeam.caregiver, 'N/A (No caregiver assigned)')}</Text>
                  </View>
                </View>
              </View>

            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// --- STYLES ---

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: NAVY_BLUE,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: NAVY_BLUE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WHITE,
  },
  loadingText: {
    fontSize: scaleFont(16),
    color: NAVY_BLUE,
    fontWeight: '600',
  },

  // --- Header Styles ---
  topDarkSection: {
    backgroundColor: NAVY_BLUE,
    height: scaleHeight(120),
    borderBottomLeftRadius: scaleWidth(35),
    borderBottomRightRadius: scaleWidth(35),
    paddingBottom: scaleHeight(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(20),
  },
  // backButton: {
  //   padding: scaleWidth(12),
  //   marginRight: scaleWidth(10),
  // },
  backButton: {
  padding: 12, 
  justifyContent: 'center',
  alignItems: 'left',
  minHeight: 55, // Removed scaleHeight
  minWidth: 55, // Removed scaleWidth
},
  backButtonText: {
    fontSize: scaleFont(35),
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
  fontSize: scaleFont(22),
  fontWeight: Platform.OS === 'ios' ? '900' : 'bold',
  color: WHITE,
  textAlign: 'center',
  flex: 1,
  marginLeft: scaleWidth(5),
  ...Platform.select({
    android: {
      includeFontPadding: false,
      fontFamily: 'sans-serif-condensed', // Android system font
    },
  }),
},
  headerSpacer: {
    width: scaleWidth(36),
  },

  // --- Body Styles ---
  bottomLightSection: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: scaleWidth(35),
    borderTopRightRadius: scaleWidth(35),
    marginTop: -scaleWidth(15),
    paddingTop: scaleWidth(20),
  },
  scrollContent: {
    paddingBottom: scaleHeight(40),
    paddingHorizontal: scaleWidth(20),
  },

  // Profile Image & Name
  profileSection: {
    alignItems: 'center',
    marginBottom: scaleHeight(20),
    width: '100%',
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleHeight(10),
  },
  profileImage: {
    width: scaleWidth(120),
    height: scaleWidth(120),
    borderRadius: scaleWidth(60),
  },
  userNameDisplay: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    color: NAVY_BLUE,
    marginTop: scaleHeight(5),
    textAlign: 'center',
  },

  // Section Title (Common for all sections)
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: NAVY_BLUE,
    marginBottom: scaleHeight(15),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(15),
  },

  // Patient Details Section
  patientDetailsSection: {
    width: '100%',
    marginBottom: scaleHeight(10),
  },

  // Info Fields
  infoFieldContainer: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    marginBottom: scaleHeight(8),
    borderLeftWidth: scaleWidth(3),
    borderLeftColor: NAVY_BLUE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoLabel: {
    fontSize: scaleFont(14),
    color: colors.textSecondary,
    marginBottom: scaleHeight(2),
    fontWeight: '500',
  },
  readOnlyText: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: NAVY_BLUE,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: LIGHT_GREY,
    marginVertical: scaleHeight(20),
    width: '100%',
  },

  // Medical Team Section
  medicalTeamSection: {
    width: '100%',
    marginBottom: scaleHeight(10),
  },
  medicalTeamContainer: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: scaleWidth(10),
    padding: scaleWidth(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicalTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(10),
    paddingVertical: scaleHeight(4),
  },
  medicalTeamLabel: {
    fontSize: scaleFont(14),
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  medicalTeamValueContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  medicalTeamValue: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: NAVY_BLUE,
    textAlign: 'right',
  },
  medicalTeamId: {
    fontSize: scaleFont(12),
    fontWeight: '400',
    color: colors.textSecondary || '#666',
    textAlign: 'right',
    marginTop: scaleHeight(2),
  },
});

export default PatientProfileScreen;