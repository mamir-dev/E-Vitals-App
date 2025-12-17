import React, { useState } from 'react'; 
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../config/globall';
import { scale, verticalScale } from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scaleWidth = size => (width / guidelineBaseWidth) * size;
const scaleHeight = size => (height / guidelineBaseHeight) * size;
const scaleFont = size => scaleWidth(size);

const HEADER_COLOR = colors.primaryButton || '#11224D';
const WHITE = '#FFFFFF';

const AccountSettings = ({ navigation }) => {
  const [twoWayAuthEnabled, setTwoWayAuthEnabled] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [sessionTimeout, setSessionTimeout] = useState('60');

  const handleUpdateSessionTimeout = () => {
    alert(`Session timeout updated to ${sessionTimeout} minutes`);
  };

  const toggleTwoWayAuth = () => {
    setTwoWayAuthEnabled(prev => !prev);
    alert(`Two-way authentication ${!twoWayAuthEnabled ? 'enabled' : 'disabled'}`);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear cache?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            alert('Cache cleared successfully!');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.fullScreenContainer}>
        <StatusBar barStyle="default" />

        <View style={styles.mainContainer}>
          
          {/* Header */}
          <View style={styles.topDarkSection}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Account Settings</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          {/* Body */}
          <View style={styles.bottomLightSection}>
            <KeyboardAvoidingView
              style={styles.keyboardContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                style={styles.scrollViewStyle}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >

                {/* ✅ Security Section (unchanged) */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}># Security</Text>

                  {/* Two-way Authentication */}
                  <View style={styles.securityItem}>
                    <View style={styles.securityInfo}>
                      <Text style={styles.securityTitle}>Two-way Authentication</Text>
                      <Text style={styles.securityDescription}>
                        Add an extra layer of security to your account
                      </Text>
                    </View>
                    <Switch
                      trackColor={{ false: colors.borderLight, true: HEADER_COLOR }}
                      thumbColor={colors.white}
                      ios_backgroundColor={colors.borderLight}
                      onValueChange={toggleTwoWayAuth}
                      value={twoWayAuthEnabled}
                    />
                  </View>

                  <View style={styles.separator} />

                  {/* Clear Cache */}
                  <View style={styles.securityItem}>
                    <View style={styles.securityInfo}>
                      <Text style={styles.securityTitle}>Clear Cache</Text>
                      <Text style={styles.securityDescription}>
                        Remove temporary files and free up space
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.clearCacheButton} onPress={handleClearCache}>
                      <Text style={styles.clearCacheText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ✅ Session Settings */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}># Session Settings</Text>

                  <View style={styles.sessionItem}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>Session Timeout</Text>
                      <Text style={styles.sessionDescription}>
                        Automatically log out after a period of inactivity
                      </Text>
                    </View>

                    <View style={styles.sessionInputRow}>
                      <TextInput
                        style={[
                          styles.sessionInput,
                          focusedField === 'sessionTimeout' && styles.inputFocused
                        ]}
                        placeholder="minutes"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        value={sessionTimeout}
                        onChangeText={setSessionTimeout}
                        onFocus={() => setFocusedField('sessionTimeout')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <TouchableOpacity style={styles.updateSessionButton} onPress={handleUpdateSessionTimeout}>
                        <Text style={styles.updateSessionButtonText}>Update</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default AccountSettings;

// --- SAME STYLES AS BEFORE (NO CHANGES NEEDED) ---

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

  // --- Header Styles (Matching NotificationSettings) ---
  topDarkSection: {
    backgroundColor: HEADER_COLOR,
    height: scaleHeight(120),
    borderBottomLeftRadius: scaleWidth(35),
    borderBottomRightRadius: scaleWidth(35),
    paddingBottom: scaleHeight(10),
    justifyContent: 'flex-start',
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
    color: WHITE,
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
        fontFamily: 'sans-serif-condensed',
      },
    }),
  },
  headerSpacer: {
    width: scaleWidth(36),
  },

  // --- Body Styles (Matching NotificationSettings) ---
  bottomLightSection: {
    flex: 1,
    backgroundColor: WHITE,
    borderTopLeftRadius: scaleWidth(35),
    borderTopRightRadius: scaleWidth(35),
    marginTop: -scaleWidth(15),
    paddingTop: scaleWidth(20),
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollViewStyle: {
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: scaleWidth(20), 
    paddingVertical: verticalScale(20),
    flexGrow: 1,
  },

  // --- Existing Account Settings Styles ---
  sectionContainer: {
    marginBottom: verticalScale(20),
    padding: scaleWidth(20),
    backgroundColor: colors.white,
    borderRadius: scaleWidth(12),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    ...fonts.subHeading,
    fontSize: scaleFont(18),
    fontWeight: '700',
    marginBottom: verticalScale(20),
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: verticalScale(16),
  },
  inputLabel: {
    ...fonts.subHeading,
    fontSize: scaleFont(14),
    marginBottom: verticalScale(8),
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Read-only field styles
  readOnlyFieldContainer: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: scaleWidth(8),
    padding: scaleWidth(16),
    backgroundColor: colors.backgroundLight,
    height: verticalScale(48),
    justifyContent: 'center',
  },
  readOnlyFieldText: {
    ...fonts.paragraph,
    fontSize: scaleFont(16),
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: scaleWidth(8),
    padding: scaleWidth(16),
    ...fonts.paragraph,
    backgroundColor: colors.backgroundLight,
    height: verticalScale(48),
    fontSize: scaleFont(16),
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: HEADER_COLOR,
    borderWidth: 2,
    backgroundColor: colors.white,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: verticalScale(20),
  },
  // Changed from saveButton to editInfoButton
  editInfoButton: {
  backgroundColor: '#11224D', // Change this line
  paddingVertical: verticalScale(16),
  borderRadius: scaleWidth(8),
  alignItems: 'center',
  borderWidth: 1,
  borderColor: colors.borderLight,
  },
  editInfoButtonText: {
    ...fonts.buttonText(colors.textWhite),
    fontSize: scaleFont(16),
    fontWeight: '600',
  },
  // Keep the old saveButton styles in case needed elsewhere
  saveButton: {
    backgroundColor: HEADER_COLOR,
    paddingVertical: verticalScale(16),
    borderRadius: scaleWidth(8),
    alignItems: 'center',
  },
  saveButtonText: {
    ...fonts.buttonText(colors.textWhite),
    fontSize: scaleFont(16),
    fontWeight: '700',
  },
  securityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  securityInfo: {
    flex: 1,
    marginRight: scaleWidth(12),
  },
  securityTitle: { 
    ...fonts.subHeading,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: verticalScale(4),
    color: colors.textPrimary,
  },
  securityDescription: {
    ...fonts.paragraph,
    fontSize: scaleFont(12),
    color: colors.textSecondary,
    lineHeight: scaleFont(16),
  },
  clearCacheButton: {
    backgroundColor: colors.error,
    paddingVertical: verticalScale(8),
    paddingHorizontal: scaleWidth(16),
    borderRadius: scaleWidth(6),
  },
  clearCacheText: {
    ...fonts.buttonText(colors.textWhite),
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  sessionItem: {
    paddingVertical: verticalScale(8),
  },
  sessionInfo: {
    marginBottom: verticalScale(12),
  },
  sessionTitle: {
    ...fonts.subHeading,
    fontSize: scaleFont(16),
    fontWeight: '600',
    marginBottom: verticalScale(4),
    color: colors.textPrimary,
  },
  sessionDescription: {
    ...fonts.paragraph,
    fontSize: scaleFont(12),
    color: colors.textSecondary,
    lineHeight: scaleFont(16),
  },
  sessionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(12)
  },
  sessionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: scaleWidth(8),
    padding: scaleWidth(16),
    ...fonts.paragraph,
    backgroundColor: colors.backgroundLight,
    height: verticalScale(48),
    fontSize: scaleFont(16),
    color: colors.textPrimary,
  },
  updateSessionButton: {
    backgroundColor: HEADER_COLOR,
    paddingVertical: verticalScale(16),
    paddingHorizontal: scaleWidth(20),
    borderRadius: scaleWidth(8),
    height: verticalScale(48),
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateSessionButtonText: { 
    ...fonts.buttonText(colors.textWhite),
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
});