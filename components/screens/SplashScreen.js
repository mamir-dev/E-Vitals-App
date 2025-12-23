import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const WHITE_COLOR = '#FFFFFF';
const NAVY_BLUE_COLOR = '#11224D';

// Base values from original design for 375 width (typical)
// We'll scale based on screen width, but keep aspect ratios consistent
const BASE_SCREEN_WIDTH = 375;
const BASE_CURVE_HEIGHT = 220;
const BASE_WAVE_START_Y = 80;
const BASE_DIP_Y = 200;

// Scale factor based on current width
const scale = width / BASE_SCREEN_WIDTH;

// Scaled values for the wave
const CURVE_HEIGHT = BASE_CURVE_HEIGHT * scale;
const WAVE_START_Y = BASE_WAVE_START_Y * scale;
const DIP_Y = BASE_DIP_Y * scale;

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Logo and texts */}
      <View style={styles.headerContainer}>
        <Image
          source={require('../../android/app/src/assets/images/logo5.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appTagline}>
          Your Health, Your Records, Your Control
        </Text>
        <Text style={styles.appDescription}>
          Secure digital health records at your fingertips
        </Text>
      </View>

      {/* White background top half */}
      <View style={styles.whiteSection} />

      {/* SVG Wave */}
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

      {/* Navy blue bottom area with more height to not cut feet */}
      <View style={styles.navySection} />

      {/* Illustration with oval shadow */}
      <View style={styles.illustrationContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE_COLOR,
  },

  headerContainer: {
    position: 'absolute',
    top: height * 0.05,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
    paddingHorizontal: width * 0.05,
  },

  logo: {
    width: 160 * scale,       // scale based on width
    height: 140 * scale,
    marginBottom: 8 * scale,
  },

  appTagline: {
    fontSize: 18 * scale,
    color: NAVY_BLUE_COLOR,
    marginBottom: 6 * scale,
    fontWeight: '600',
    textAlign: 'center',
  },

  appDescription: {
    fontSize: 14 * scale,
    color: '#555',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20 * scale,
  },

  whiteSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: WHITE_COLOR,
  },

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

  navySection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '26%', // increased from 20% to 26% to avoid clipping feet
    backgroundColor: NAVY_BLUE_COLOR,
    zIndex: 1,
  },

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

  illustration: {
    width: width * 0.95,
    height: CURVE_HEIGHT * 3,
    maxWidth: 500,
    maxHeight: 1400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },

  ovalFloor: {
    position: 'absolute',
    bottom: '-6%',
    alignSelf: 'center',
    width: width * 0.88,
    height: 20 * scale,
    backgroundColor: '#acacacff',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#9c9b9bff',
    zIndex: 5,
  },
});