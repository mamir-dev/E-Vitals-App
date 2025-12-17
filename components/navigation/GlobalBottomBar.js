/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Dimensions, 
  Platform, 
  TouchableOpacity 
} from 'react-native';

// Importing global configuration settings for colors and fonts
import { colors, fonts } from '../../config/globall';

// --- Responsive Scaling Setup ---
const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Scaling functions for responsive design
const scaleWidth = (size) => (width / guidelineBaseWidth) * size;
const scaleHeight = (size) => (height / guidelineBaseHeight) * size;
const scaleFont = (size) => scaleWidth(size);

// --- Screen Imports ---
import Home from '../screens/Home';
import Appointment from '../screens/Appointment';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

/**
 * GlobalBottomBar component defines the primary navigation for the application.
 * 5 tabs: Profile, Appointment, Home, Chat, Settings
 */
export default function GlobalBottomBar({ navigation }) {
  return (
    <Tab.Navigator
      initialRouteName="Home" // Set Home as the initial active tab
      screenOptions={({ route }) => ({
        headerShown: false, 
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,

        tabBarIcon: ({ focused }) => {
          let iconSource;
          let iconSize = scaleWidth(22); // Same size for all icons

          // Load icons based on the route name
          if (route.name === 'Home') {
            iconSource = require('../../android/app/src/assets/images/home1.png');
          } else if (route.name === 'Appointment') {
            iconSource = require('../../android/app/src/assets/images/schedule.png');
          } else if (route.name === 'Agent') {
            iconSource = require('../../android/app/src/assets/images/ai.png');
          } else if (route.name === 'Profile') {
            iconSource = require('../../android/app/src/assets/images/user.png');
          } else if (route.name === 'Settings') {
            iconSource = require('../../android/app/src/assets/images/settings.png');
          }

          return (
            <View style={styles.iconColumn}>
              <View style={[
                styles.iconContainer,
                focused && styles.activeIconBackground,
              ]}>
                <Image
                  source={iconSource}
                  style={{
                    ...styles.icon,
                    tintColor: focused ? colors.background : colors.inactive,
                    width: iconSize,
                    height: iconSize,
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
          );
        },

        tabBarLabel: ({ focused }) => (
          <Text 
            style={[styles.label, 
              { color: focused ? colors.primaryButton : colors.inactive }
            ]}>
            {route.name}
          </Text>
        ),
      })}
    >
      {/* Tab Screens - All tabs now have the same alignment and size */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Appointment" component={Appointment} />
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Agent" component={ChatScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// --- Stylesheet for the component ---
const styles = StyleSheet.create({
  // Style for the main tab bar container
  tabBar: {
    height: Platform.select({ ios: scaleHeight(95), android: scaleHeight(85) }),
    paddingBottom: Platform.select({ ios: scaleHeight(12), android: scaleHeight(10) }),
    paddingTop: scaleHeight(8),
    backgroundColor: colors.background,
    elevation: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderTopWidth: 0,
    position: 'relative',
  },
  
  // Style for each tab item (ensures even spacing)
  tabBarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: width / 5,
  },

  // Column layout for icon and text within the tab
  iconColumn: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  // Background container for the icon - same for all tabs
  iconContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: scaleWidth(42), 
    height: scaleWidth(42), 
    borderRadius: scaleWidth(21),
  },

  // Blue background when a tab is active/focused
  activeIconBackground: { 
    backgroundColor: colors.primaryButton 
  },

  // Icon image dimensions
  icon: { 
    width: scaleWidth(22), 
    height: scaleWidth(22) 
  },

  // Label text styling - made smaller
  label: { 
    fontSize: scaleFont(9.85), // Reduced from 10 to 9
     fontWeight: 'bold',
    marginTop: scaleHeight(10.5),
  },
});