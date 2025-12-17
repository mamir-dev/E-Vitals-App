import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet, 
  Dimensions, Alert, Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { colors, scaleFont } from '../../config/globall';

// Get device dimensions for responsive design
const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Scaling functions for responsive UI across different screen sizes
const scaleWidth = size => (width / guidelineBaseWidth) * size;
const scaleHeight = size => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scaleWidth(size) - size) * factor;

// Enhanced responsive scaling with limits
const responsiveScale = (size, min = size * 0.8, max = size * 1.2) => {
  const scaledSize = moderateScale(size);
  return Math.min(Math.max(scaledSize, min), max);
};

const Login = ({ navigation }) => {
  // State management for form inputs and UI states
  const [username, setUsername] = useState(''); // Stores username input
  const [password, setPassword] = useState(''); // Stores password input
  const [showPassword, setShowPassword] = useState(false); // Toggles password visibility
  const [isLoading, setIsLoading] = useState(false); // Loading state during API call
  const [isUsernameFocused, setIsUsernameFocused] = useState(false); // Input focus state for styling
  const [isPasswordFocused, setIsPasswordFocused] = useState(false); // Input focus state for styling

  /**
   * Handles the login process including validation, API call, and navigation
   */
  const handleLogin = async () => {
    // Validate username input
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    
    // Validate password input
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    // Set loading state to true to show loading UI
    setIsLoading(true);
    
    try {
      // API call to login endpoint
      const response = await fetch('https://evitals.life/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
      });

      // Parse response text first, then try to convert to JSON
      const raw = await response.text();
      let data = null;
      try { 
        data = raw ? JSON.parse(raw) : null; 
      } catch (e) {
        // Handle JSON parsing errors silently
      }

      // Check if response was successful and data is valid
      if (!response.ok || !data) {
        const message = (data && (data.message || data.error)) || 'Invalid credentials or server error';
        Alert.alert('Login failed', String(message));
        return;
      }

      // Store authentication token if received
      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      }
      
      // Store user data if received
      if (data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      } 
      
      /* Check if login succeeded
      if (data.success && data.data) {
      const patientData = data.data.patient;
      await AsyncStorage.setItem('patientData', JSON.stringify(patientData));

      // Navigate to main dashboard
      navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
      });
    } else {
    Alert.alert('Login Failed', 'Invalid username or password');
  } */

      // Navigate to main app screen and reset navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
      
    } catch (error) {
      // Handle network errors
      Alert.alert('Network error', 'Unable to reach the server. Please try again.');
    } finally {
      // Reset loading state regardless of success or failure
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Background Image */}
        {/* <Image
          source={require('../../android/app/src/assets/images/login-bg.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        /> */}
        
        {/* Keyboard handling for iOS and Android */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -150 : -50}
        >
          <View style={styles.contentContainer}>
            
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../android/app/src/assets/images/logo5.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Login Form Section */}
            <View style={styles.formContainer}>
              {/* Form Header */}
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Sign in to access your health data</Text>

              {/* Username Input Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  placeholder="Enter your username"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.input,
                    { 
                      borderColor: isUsernameFocused ? colors.primaryButton : colors.borderLight 
                    }
                  ]}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setIsUsernameFocused(true)}
                  onBlur={() => setIsUsernameFocused(false)}
                  autoCapitalize="none"
                  editable={!isLoading}
                  returnKeyType="next"
                />
              </View>

              {/* Password Input Field with Toggle Visibility */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.input,
                      { 
                        borderColor: isPasswordFocused ? colors.primaryButton : colors.borderLight 
                      }
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    autoCapitalize="none"
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  {/* Eye icon to toggle password visibility */}
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIconWrapper}
                    disabled={isLoading}
                  >
                    <Image
                      source={
                        showPassword
                          ? require('../../android/app/src/assets/images/eye-open.png')
                          : require('../../android/app/src/assets/images/eye-close.png')
                      }
                      style={styles.eyeIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  disabled={isLoading}
                >
                  <Text style={isLoading ? styles.forgotTextDisabled : styles.forgotText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button with Gradient */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[colors.primaryButton, colors.secondaryButton]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Security Compliance Text */}
              <View style={styles.securityContainer}>
                <Text style={styles.securityText}>
                  HIPAA Compliant • End-to-End Encrypted
                </Text>
              </View>
            </View>

            {/* Footer Section - KEPT IN ORIGINAL POSITION */}
            <View style={styles.footerContainer}>
              <Text style={styles.developedBy}>Developed By</Text>
              <Text style={styles.companyName}>Revive Medical Technologies Inc.</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// Stylesheet for the Login component - ONLY made responsive without layout changes
const styles = StyleSheet.create({
  // Main container style
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Background image style - covers entire screen
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  // Keyboard avoiding view style
  keyboardAvoid: {
    flex: 1,
    width: '100%',
  },
  // Main content container with responsive padding - KEPT ORIGINAL LAYOUT
  // Main content container with responsive padding - UPDATED FOR BETTER FOOTER POSITIONING
  // Main content container
contentContainer: {
  flex: 1,
  justifyContent: 'space-between', // This pushes footer to bottom
  alignItems: 'center',
  paddingHorizontal: responsiveScale(25, 15, 30),
  paddingTop: Platform.OS === 'ios' ? responsiveScale(20, 10, 25) : responsiveScale(30, 15, 35),
  paddingBottom: responsiveScale(20, 10, 25),
},
  // Logo container with responsive margins - KEPT ORIGINAL LAYOUT
 // Logo container with responsive margins
logoContainer: {
  marginBottom: 5, // Reduced further to match login screen spacing
  alignItems: 'center',
},
// Logo image with responsive sizing - FIXED
// Logo image with responsive sizing - INCREASED SIZE
logoImage: {
  width: responsiveScale(160, 140, 180), // Increased from 120
  height: responsiveScale(160, 140, 180), // Increased from 100
  resizeMode: 'contain',
},
  // Form container with shadow and responsive design
  // Form container with shadow and responsive design
  formContainer: {
    width: '100%',
    maxWidth: responsiveScale(320, 280, 350),
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(14),
    padding: responsiveScale(18, 15, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: responsiveScale(20, 15, 25), // Increased from 10 for better spacing
    flexShrink: 1,
    marginTop: responsiveScale(30, 28, 30), // Added top margin for centering
  },
  // Form title style with responsive font
  formTitle: {
    fontSize: responsiveScale(20, 18, 22),
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: responsiveScale(4, 2, 6),
  },
  // Form subtitle style with responsive font
  formSubtitle: {
    fontSize: responsiveScale(12, 11, 13),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: responsiveScale(16, 12, 18),
    fontWeight: '500',
  },
  // Input group container
  inputGroup: {
    marginBottom: responsiveScale(12, 10, 14),
  },
  // Input label style with responsive font
  label: {
    fontSize: responsiveScale(12, 11, 13),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: responsiveScale(4, 2, 6),
  },
  // Text input style with responsive sizing
  input: {
    borderWidth: 1.5,
    borderRadius: moderateScale(10),
    paddingVertical: responsiveScale(12, 10, 14),
    paddingHorizontal: responsiveScale(14, 12, 16),
    backgroundColor: colors.textWhite,
    color: colors.textPrimary,
    fontSize: responsiveScale(14, 13, 15),
    minHeight: responsiveScale(44, 40, 48),
  },
  // Password container with relative positioning for eye icon
  passwordContainer: {
    position: 'relative',
  },
  // Eye icon wrapper positioned absolutely within password container
  eyeIconWrapper: {
    position: 'absolute',
    right: responsiveScale(12, 10, 14),
    top: '50%',
    transform: [{ translateY: -responsiveScale(10, 8, 12) }],
    padding: responsiveScale(4, 3, 5),
  },
  // Eye icon style with responsive sizing
  eyeIcon: {
    width: responsiveScale(18, 16, 20),
    height: responsiveScale(18, 16, 20),
    tintColor: colors.textSecondary,
  },
  // Options container for forgot password link
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: responsiveScale(14, 12, 16),
  },
  // Forgot password text style with responsive font
  forgotText: {
    fontSize: responsiveScale(12, 11, 13),
    color: colors.primaryButton,
    fontWeight: '600',
  },
  // Disabled forgot password text style
  forgotTextDisabled: {
    fontSize: responsiveScale(12, 11, 13),
    color: colors.primaryButton,
    fontWeight: '600',
    opacity: 0.5,
  },
  // Login button container
  button: {
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    marginBottom: responsiveScale(10, 8, 12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  // Gradient background for login button
  buttonGradient: {
    paddingVertical: responsiveScale(12, 10, 14),
    alignItems: 'center',
  },
  // Button text style with responsive font
  buttonText: {
    color: colors.textWhite,
    fontSize: responsiveScale(14, 13, 15),
    fontWeight: '700',
  },
  // Disabled button style
  buttonDisabled: {
    opacity: 0.7,
  },
  // Security text container
  securityContainer: {
    alignItems: 'center',
    paddingVertical: responsiveScale(4, 2, 6),
  },
  // Security compliance text style with responsive font
  securityText: {
    fontSize: responsiveScale(10, 9, 11),
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Footer container - KEPT ORIGINAL POSITION AND STYLING
  // Footer container - ADJUSTED FOR BOTTOM POSITION
  footerContainer: {
    alignItems: 'center',
    marginTop: 'auto', // This pushes it to bottom
    marginBottom: responsiveScale(15, 10, 20), // Slightly increased
    flexShrink: 1,
  },
  // "Developed By" text style with responsive font
  developedBy: {
    fontSize: 16,
    color: colors.blackButton,
    fontWeight: 700,
    textAlign: 'center',
  },
  // Company name text style with responsive font
  companyName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: 500,
    textAlign: 'center',
  },
});

export default Login;
