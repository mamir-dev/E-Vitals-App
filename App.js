import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import SplashScreen from './components/screens/SplashScreen';
import Login from './components/screens/Login';
import ForgotPassword from './components/screens/ForgotPassword';
import Summary from './components/screens/Summary';
import Appointment from './components/screens/Appointment';
import AudioCall from './components/screens/AudioCall';
import SMS from './components/screens/SMS';
import ProfileScreen from './components/screens/ProfileScreen';
import PatientEditForm from './components/screens/PatientEditScreen';
import ChangePassword from './components/screens/ChangePassword';
import AccountSettings from './components/screens/AccountSettings';
import FollowUp from './components/screens/FollowUp';
import DataList from './components/screens/DataList';
import ChatScreen from './components/screens/ChatScreen';
import AIModulesScreen from './components/screens/AIModulesScreen';
import PredictiveAnalysisScreen from './components/screens/PredictiveAnalysisScreen';
import AnomalyDetectionScreen from './components/screens/AnomalyDetectionScreen';
import ClinicalDecisionSupportScreen from './components/screens/ClinicalDecisionSupportScreen';
import DietRecommendationScreen from './components/screens/DietRecommendationScreen';
import MedicalRecommendationScreen from './components/screens/MedicalRecommendationScreen';
import Notifications from './components/screens/Notifications';
import SettingsScreen from './components/screens/SettingsScreen';
import MCQ_Agent from './components/screens/MCQ_Agent';
import StoreSummaryScreen from './components/screens/StoreSummaryScreen';

// Global Bottom Bar
import GlobalBottomBar from './components/navigation/GlobalBottomBar';

// Utils
import { WelcomeManager } from './utils/WelcomeManager';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      const hasSeen = await WelcomeManager.hasSeenWelcome();
      // CORRECTED LOGIC:
      // If user HAS SEEN welcome screen → go directly to Login
      // If user HAS NOT SEEN welcome screen → show Splash first
      setInitialRoute(hasSeen ? 'Login' : 'Splash');
    };
    checkWelcomeStatus();
  }, []);

  // Show nothing until we determine the initial route
  if (!initialRoute) {
    return null; // Or a loading component
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        {/* Splash Screen (shown only on first launch) */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* Auth Flow */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

        {/* Main App */}
        <Stack.Screen name="MainTabs" component={GlobalBottomBar} />

        {/* Other Screens */}
        <Stack.Screen name="Summary" component={Summary} />
        <Stack.Screen name="Appointment" component={Appointment} />
        <Stack.Screen name="AudioCall" component={AudioCall} />
        <Stack.Screen name="SMS" component={SMS} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="PatientEditForm" component={PatientEditForm} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="AccountSettings" component={AccountSettings} />
        <Stack.Screen name="FollowUp" component={FollowUp} />
        <Stack.Screen name="DataList" component={DataList} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="AIModules" component={AIModulesScreen} />
        <Stack.Screen name="PredictiveAnalysis" component={PredictiveAnalysisScreen} />
        <Stack.Screen name="AnomalyDetection" component={AnomalyDetectionScreen} />
        <Stack.Screen name="ClinicalDecisionSupport" component={ClinicalDecisionSupportScreen} />
        <Stack.Screen name="DietRecommendation" component={DietRecommendationScreen} />
        <Stack.Screen name="MedicalRecommendation" component={MedicalRecommendationScreen} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="MCQ_Agent" component={MCQ_Agent} />
        <Stack.Screen name="StoreSummary" component={StoreSummaryScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}