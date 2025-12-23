import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions,
  StatusBar,
  ScrollView
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../config/globall';

const { width, height } = Dimensions.get('window');

// Set base design sizes for responsive scaling
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Functions to make design responsive
const scaleWidth = size => (width / guidelineBaseWidth) * size;
const scaleHeight = size => (height / guidelineBaseHeight) * size;
const scaleFont = size => scaleWidth(size);

// Define colors for UI
const HEADER_COLOR = colors.primaryButton || '#dae2f7';
const WHITE = '#FFFFFF';

export default function ChangePassword({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onSave = () => {
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }
    alert('Password changed successfully!');
    navigation.goBack();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.fullScreenContainer}>
        {/* Status Bar */}
        {/* <StatusBar backgroundColor={HEADER_COLOR} barStyle="light-content" /> */}
        <StatusBar barStyle="default" />

        
        <View style={styles.mainContainer}>
          {/* Header with Back Button */}
          <View style={styles.topDarkSection}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Change Password</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* White section (Body section) */}
          <View style={styles.bottomLightSection}>
            <KeyboardAvoidingView
              style={styles.keyboardContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.formContainer}>
                  <Text style={styles.label}>Current Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current password"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholderTextColor={colors.textSecondary}
                  />

                  <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: HEADER_COLOR,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: HEADER_COLOR,
  },

  // --- Header Styles ---
  topDarkSection: {
    backgroundColor: HEADER_COLOR,
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
  padding: 6, 
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
    marginTop: scaleWidth(-30),
    paddingTop: scaleWidth(20),
    paddingHorizontal: scaleWidth(20),
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleHeight(40),
  },
  formContainer: {
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(10),
  },

  // --- Form Styles ---
  label: {
    fontSize: scaleFont(16),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: scaleHeight(8),
    marginTop: scaleHeight(15),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: scaleWidth(12),
    paddingVertical: scaleHeight(14),
    paddingHorizontal: scaleWidth(16),
    marginBottom: scaleHeight(5),
    fontSize: scaleFont(16),
    backgroundColor: WHITE,
    color: colors.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: HEADER_COLOR,
    paddingVertical: scaleHeight(16),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    marginTop: scaleHeight(30),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: scaleFont(18),
    fontWeight: '700',
    color: WHITE,
  },
});