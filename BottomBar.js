import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, Dimensions } from 'react-native';
import globalStyles from './globalStyles';

const { width } = Dimensions.get('window');

const scaleWidth = (size) => (width / 375) * size;
const scaleHeight = (size) => (812 / 812) * size; 

const BottomBar = ({ onButtonPress, currentScreen }) => {
  return (
    <View style={styles.container}>
      
      {/* Home */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => onButtonPress('Home')}
      >
        <Image 
          source={require('../assets/home.png')} 
          style={[
            styles.icon, 
            currentScreen === 'Home' ? styles.activeIcon : styles.inactiveIcon
          ]} 
        />
        <Text style={[
          styles.buttonText,
          currentScreen === 'Home' ? styles.activeText : styles.inactiveText
        ]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Appointment */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => onButtonPress('Appointment')}
      >
        <Image 
          source={require('../assets/appointment.png')} 
          style={[
            styles.icon, 
            currentScreen === 'Appointment' ? styles.activeIcon : styles.inactiveIcon
          ]} 
        />
        <Text style={[
          styles.buttonText,
          currentScreen === 'Appointment' ? styles.activeText : styles.inactiveText
        ]}>
          Appointment
        </Text>
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => onButtonPress('Settings')}
      >
        <Image 
          source={require('../assets/settings.png')} 
          style={[
            styles.icon, 
            currentScreen === 'Settings' ? styles.activeIcon : styles.inactiveIcon
          ]} 
        />
        <Text style={[
          styles.buttonText,
          currentScreen === 'Settings' ? styles.activeText : styles.inactiveText
        ]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: scaleHeight(70),
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: scaleWidth(10),
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingVertical: scaleHeight(10),
  },
  icon: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    resizeMode: 'contain',
    marginBottom: scaleHeight(4),
  },
  activeIcon: {
    tintColor: globalStyles.primaryColor.color, 
  },
  inactiveIcon: {
    tintColor: '#888888',
  },
  buttonText: {
    fontSize: scaleWidth(12),
    marginTop: scaleHeight(2),
  },
  activeText: {
    color: globalStyles.primaryColor.color,
    fontWeight: '600',
  },
  inactiveText: {
    color: '#888888',
    fontWeight: '400',
  },
});

export default BottomBar;
