import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// --- Color Configuration ---
const WHITE_COLOR = '#FFFFFF';
const NAVY_BLUE_COLOR = '#11224D'; 

// --- Curve Geometry Configuration ---
const CURVE_HEIGHT = 220;   // INCREASED: from 180 to 220 (taller wave area)
const WAVE_START_Y = 80;    // Y-coordinate where the curve starts and ends
const DIP_Y = 200;          // INCREASED: from 160 to 200 (deeper dip for taller wave)

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Timer to automatically navigate away after 3 seconds
    const timer = setTimeout(async () => {
      // NOTE: Make sure 'Login' is a valid screen name in your navigator.
      navigation.replace('Login');
    }, 6000); // 5 seconds delay

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Logo and App Name at the Top */}
      <View style={styles.headerContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../android/app/src/assets/images/logo5.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* App Name and Tagline */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appTagline}>Your Health, Your Records, Your Control</Text>
          <Text style={styles.appDescription}>
            Secure digital health records at your fingertips
          </Text>
        </View>
      </View>

      {/* 1. White Top Section: The background color above the wave */}
      <View style={styles.whiteSection} />
      
      {/* 2. SVG Curve: Renders the wave shape */}
      <View style={styles.curveContainer}>
        <Svg height={CURVE_HEIGHT} width={width} style={styles.svg}>
          <Path
            d={`
              M 0 ${WAVE_START_Y}
              C ${width * 0.25} 0, ${width * 0.75} ${DIP_Y}, ${width} ${WAVE_START_Y}
              L ${width} ${CURVE_HEIGHT}
              L 0 ${CURVE_HEIGHT}
              Z
            `}
            fill={NAVY_BLUE_COLOR}
          />
        </Svg>
      </View>
      
      {/* 3. Navy Blue Bottom Section: The background color below the wave */}
      <View style={styles.navySection} />
      
      {/* 4. Illustration: Absolutely positioned and centered over the wave area */}
      <View style={styles.illustrationContainer}>
        {/* White Oval Floor under the characters */}
        <View style={styles.ovalFloor} />
        <Image
          source={require('../../android/app/src/assets/images/illustration-img.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default SplashScreen;

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE_COLOR,
  },
  
  // Header with Logo and App Name - Adjusted to match login screen
  headerContainer: {
    position: 'absolute',
    top: 40, 
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 5, // Reduced to match login screen spacing
    alignItems: 'center',
  },
  logo: {
    width: 160, // Match login screen width: responsiveScale(160, 140, 180)
    height: 140, // Match login screen height: responsiveScale(140, 120, 160)
    resizeMode: 'contain', // Same as login screen
  },
  appInfoContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  appTagline: {
    fontSize: 18,
    color: NAVY_BLUE_COLOR,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '600',
  },
  appDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
  },
  
  // Section above the curve
  whiteSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: WHITE_COLOR,
  },
  
  // SVG container for the wave
  curveContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: CURVE_HEIGHT,
    zIndex: 10,
  },
  svg: {
    position: 'absolute',
    top: 0,
  },
  
  // Section below the curve
  navySection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: NAVY_BLUE_COLOR,
    zIndex: 1,
  },
  
  // Container to hold and center the image
  illustrationContainer: {
    position: 'absolute',
    top: '32%',
    left: 0,
    right: 0,
    height: CURVE_HEIGHT * 1.8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  
  // Image styling
  illustration: {
    width: width * 1.0,
    height: CURVE_HEIGHT * 3.0,
    maxWidth: 500,
    maxHeight: 1400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  
  // Oval floor with blur effect added
ovalFloor: {
    position: 'absolute',
    bottom: '-7%',
    alignSelf: 'center',
    width: width * 0.88,
    height: 20,
    backgroundColor: '#e6e5e5ff',
    borderRadius: 100,
    zIndex: 5,
    
    // Removed all blur-related properties
    // Kept only essential styling for the ellipse shape
    borderWidth: 1,
    borderColor: '#ebebebff', // Slightly darker border for definition
  },
});