import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../../config/globall';

const { width, height } = Dimensions.get('window');

// Set base design sizes for responsive scaling
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Functions to make design responsive
const scaleWidth = size => (width / guidelineBaseWidth) * size;
const scaleHeight = size => (height / guidelineBaseHeight) * size;
const scaleFont = size => scaleWidth(size);

const NAVY_BLUE = colors.primaryButton || '#11224D';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F4F7F9';

const Settings = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('main');

  useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            alert('Logged out successfully!');
            // Add your logout logic here
            navigation.navigate('Login'); // Uncomment to navigate to login screen
          }
        }
      ]
    );
  };

  const settingsButtons = [
    {
      id: 1,
      title: 'Account Settings',
      icon: require('../../android/app/src/assets/images/account-settings.png'),
      screen: 'AccountSettings',
      description: 'Manage your account information'
    },
    {
      id: 2,
      title: 'Change Password',
      icon: require('../../android/app/src/assets/images/password.png'),
      screen: 'ChangePassword',
      description: 'Update your password'
    },
    {
      id: 3,
      title: 'Follow-up',
      icon: require('../../android/app/src/assets/images/follow-up-icon.png'),
      screen: 'FollowUp',
      description: 'Manage follow-up templates'
    },
    {
      id: 4,
      title: 'Logout',
      icon: require('../../android/app/src/assets/images/logout.png'),
      screen: 'logout',
      description: 'Sign out from the application',
      isLogout: true
    }
  ];

  const handleButtonPress = (button) => {
    if (button.isLogout) {
      handleLogout();
    } else {
      // Navigate to the respective screen
      navigation.navigate(button.screen);
    }
  };

  // Custom component for Settings Cards - Same as Profile screen
  const SettingsCard = ({ button }) => (
    <TouchableOpacity
      style={styles.settingsCard}
      onPress={() => handleButtonPress(button)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardIconTitle}>
          <View style={styles.iconContainer}>
            <Image 
              source={button.icon} 
              style={styles.buttonIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>
              {button.title}
            </Text>
            <Text style={styles.cardDescription}>
              {button.description}
            </Text>
          </View>
        </View>
        {/* Always show arrow for all cards including logout */}
        <View style={styles.arrowContainer}>
          <Text style={styles.arrowIcon}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.fullScreenContainer}>
        {/* Status Bar */}
        <StatusBar barStyle="default" />

        
        <View style={styles.mainContainer}>
          {/* Header - Navy Blue Bar - Same as Profile screen */}
          <View style={styles.topDarkSection}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('Home')} 
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Settings</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* White section (Body section) - Same as Profile screen */}
          <View style={styles.bottomLightSection}>
            {/* Settings Section Title */}
            <View style={styles.settingsHeader}>
              <Text style={styles.sectionTitle}>Application Settings</Text>
              <Text style={styles.sectionSubtitle}>
                Manage your account preferences and application settings
              </Text>
            </View>

            {/* Settings Cards - Using same card design as Profile screen */}
            <View style={styles.settingsCardsContainer}>
              {settingsButtons.map((button) => (
                <SettingsCard key={button.id} button={button} />
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// --- STYLES - Same as Profile screen structure ---

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

  // --- Header Styles - Same as Profile screen ---
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
    fontSize: scaleFont(24),
    fontWeight: 'bold',
    color: WHITE,
    textAlign: 'center',
    flex: 1,
    marginLeft: scaleWidth(5),
  },
  headerSpacer: {
    width: scaleWidth(36),
  },

  // --- Body Styles - Same as Profile screen ---
  bottomLightSection: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: scaleWidth(35),
    borderTopRightRadius: scaleWidth(35),
    marginTop: -scaleWidth(15),
    paddingTop: scaleWidth(20),
    paddingHorizontal: scaleWidth(20),
  },

  // Settings Header
  settingsHeader: {
    marginBottom: scaleHeight(20),
    width: '100%',
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: NAVY_BLUE,
    marginBottom: scaleHeight(5),
  },
  sectionSubtitle: {
    fontSize: scaleFont(14),
    color: colors.textSecondary,
    lineHeight: scaleFont(18),
  },

  // Settings Cards Container
  settingsCardsContainer: {
    width: '100%',
  },

  // Settings Card - Same design as Profile screen info fields
  settingsCard: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(16),
    marginBottom: scaleHeight(12),
    borderLeftWidth: scaleWidth(3),
    borderLeftColor: NAVY_BLUE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: scaleWidth(44),
    height: scaleWidth(44),
    borderRadius: scaleWidth(10),
    backgroundColor: NAVY_BLUE + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scaleWidth(12),
    padding: scaleWidth(8),
  },
  buttonIcon: {
    width: scaleWidth(22),
    height: scaleWidth(22),
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: NAVY_BLUE,
    marginBottom: scaleHeight(4),
  },
  cardDescription: {
    fontSize: scaleFont(14),
    color: colors.textSecondary,
    lineHeight: scaleFont(18),
  },
  arrowContainer: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scaleWidth(8),
  },
  arrowIcon: {
    fontSize: scaleFont(20),
    color: colors.textSecondary,
    fontWeight: '300',
  },
});

export default Settings;