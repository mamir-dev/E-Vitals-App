import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../config/globall';

// Device dimensions
const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Scaling helpers
const scaleWidth = size => (width / guidelineBaseWidth) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scaleWidth(size) - size) * factor;

const responsiveScale = (size, min = size * 0.85, max = size * 1.15) => {
  const scaled = moderateScale(size);
  return Math.min(Math.max(scaled, min), max);
};

const Login = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://evitals.life/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const raw = await response.text();
      let data = raw ? JSON.parse(raw) : null;

      if (!response.ok || !data) {
        Alert.alert('Login failed', 'Invalid credentials or server error');
        return;
      }

      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      }
      if (data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch {
      Alert.alert('Network error', 'Unable to reach the server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../android/app/src/assets/images/logo5.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>
                Sign in to access your health data
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: isUsernameFocused
                        ? colors.primaryButton
                        : colors.borderLight,
                    },
                  ]}
                  placeholder="Enter your username"
                  placeholderTextColor={colors.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setIsUsernameFocused(true)}
                  onBlur={() => setIsUsernameFocused(false)}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: isPasswordFocused
                          ? colors.primaryButton
                          : colors.borderLight,
                      },
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    editable={!isLoading}
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeIconWrapper}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Image
                      source={
                        showPassword
                          ? require('../../android/app/src/assets/images/eye-open.png')
                          : require('../../android/app/src/assets/images/eye-close.png')
                      }
                      style={styles.eyeIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.button}
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

              <View style={styles.securityContainer}>
                <Text style={styles.securityText}>
                  HIPAA Compliant • End-to-End Encrypted
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.developedBy}>Developed By</Text>
              <Text style={styles.companyName}>
                Revive Medical Technologies Inc.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveScale(24),
    paddingTop: responsiveScale(20),
    paddingBottom: responsiveScale(30),
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: responsiveScale(10),
    marginBottom: responsiveScale(10),
  },

  logoImage: {
    width: responsiveScale(140),
    height: responsiveScale(140),
  },

  formContainer: {
    width: '100%',
    maxWidth: responsiveScale(340),
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(16),
    padding: responsiveScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 15,
    marginBottom: responsiveScale(20),
  },

  formTitle: {
    fontSize: responsiveScale(20),
    fontWeight: '700',
    textAlign: 'center',
    color: '#000000',
    marginBottom: responsiveScale(4),
  },

  formSubtitle: {
    fontSize: responsiveScale(12),
    textAlign: 'center',
    marginBottom: responsiveScale(16),
    color: colors.textSecondary,
  },

  inputGroup: {
    marginBottom: responsiveScale(12),
  },

  label: {
    fontSize: responsiveScale(12),
    marginBottom: responsiveScale(4),
    fontWeight: '600',
    color: '#000000',
  },

  input: {
    borderWidth: 1.5,
    borderRadius: moderateScale(10),
    paddingHorizontal: responsiveScale(12),
    minHeight: responsiveScale(46),
    fontSize: responsiveScale(14),
    color: colors.textPrimary,
    backgroundColor: '#ffffff',
  },

  passwordContainer: {
    position: 'relative',
  },

  eyeIconWrapper: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },

  eyeIcon: {
    width: responsiveScale(18),
    height: responsiveScale(18),
  },

  optionsContainer: {
    alignItems: 'flex-end',
    marginBottom: responsiveScale(12),
  },

  forgotText: {
    fontSize: responsiveScale(12),
    color: colors.primaryButton,
    fontWeight: '600',
  },

  button: {
    width: '100%',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },

  buttonGradient: {
    minHeight: responsiveScale(48),
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: responsiveScale(14),
    fontWeight: '700',
  },

  securityContainer: {
    marginTop: responsiveScale(8),
    alignItems: 'center',
  },

  securityText: {
    fontSize: responsiveScale(10),
    color: colors.textSecondary,
  },

  footerContainer: {
    alignItems: 'center',
    paddingVertical: responsiveScale(16),
  },

  developedBy: {
    fontSize: responsiveScale(14),
    fontWeight: '700',
    color: '#000000',
    marginBottom: responsiveScale(4),
  },

  companyName: {
    fontSize: responsiveScale(12),
    color: '#000000',
    textAlign: 'center',
  },
});

export default Login;