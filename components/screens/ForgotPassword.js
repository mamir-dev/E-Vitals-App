import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { colors, fonts } from '../../config/globall';

// Get device width and height
const { width, height } = Dimensions.get('window');

// Scale helpers
const scaleWidth = (size) => (width / 375) * size; // 375 is base iPhone width
const scaleHeight = (size) => (height / 812) * size; // 812 is base iPhone height

const API_BASE = "http://192.168.1.5:5000/api/auth";

const ForgotPassword = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  // Step 1: Send OTP
  const handleNext = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "OTP has been sent to your email.");
        setStep(2);
      } else {
        Alert.alert("Error", data.message || "Failed to send OTP");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };

  // Step 2: Verify OTP
  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "OTP verified successfully.");
        setStep(3);
      } else {
        Alert.alert("Error", data.message || "Invalid OTP");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };

  // Step 3: Reset Password
  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Your password has been reset.");
        navigation.replace('Login');
      } else {
        Alert.alert("Error", data.message || "Password reset failed.");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      {step === 1 && (
        <>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity style={styles.button} onPress={handleOtpVerify}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="New password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.backToLogin}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: scaleWidth(20),
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  title: {
    ...fonts.heading,
    marginBottom: scaleHeight(20),
    textAlign: 'center',
  },
  label: {
    ...fonts.label,
    marginBottom: scaleHeight(8),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: scaleWidth(8),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(12),
    marginBottom: scaleHeight(15),
    ...fonts.inputText,
    backgroundColor: colors.textWhite,
  },
  button: {
    backgroundColor: colors.primaryButton,
    paddingVertical: scaleHeight(14),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
    marginVertical: scaleHeight(10),
    alignSelf: 'center',
    width: '100%',
  },
  buttonText: {
    ...fonts.buttonText(colors.textWhite),
  },
  backToLogin: {
    textAlign: 'center',
    ...fonts.label,
    marginTop: scaleHeight(15),
  },
});
