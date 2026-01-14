import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    ScrollView,
    Image,
    Platform,
} from "react-native";
import { colors, fonts } from '../../config/globall';

const { width, height } = Dimensions.get("window");

// Set base design sizes for responsive scaling
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Functions to make design responsive
const scaleWidth = size => (width / guidelineBaseWidth) * size;
const scaleHeight = size => (height / guidelineBaseHeight) * size;
const scaleFont = size => scaleWidth(size);

// Define colors for UI
const NAVY_BLUE = colors.primaryButton || '#293d55';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F4F7F9';

const AI_MODULES = [
    {
        id: 'symptomChecker',
        title: 'Symptom Checker',
        description: 'General health assessment and symptom analysis.',
        icon: require('../../android/app/src/assets/images/dr.png'),
        color: '#4A90E2',
    },
    {
        id: 'predictiveAnalysis',
        title: 'Predictive Analysis',
        description: 'Forecast health trends based on your history.',
        // icon: require('../../android/app/src/assets/images/bar-chart.png'),
        color: '#50E3C2',
    },
    {
        id: 'anomalyDetection',
        title: 'Anomaly Detection',
        description: 'Identify unusual spikes or patterns in vitals.',
        // icon: require('../../android/app/src/assets/images/alerts_bg.png'), // Using bg as icon variant
        color: '#F5A623',
    },
    {
        id: 'clinicalDecisionSupport',
        title: 'Clinical Decision Support',
        description: 'Guidance based on medical protocols.',
        // icon: require('../../android/app/src/assets/images/agents.png'),
        color: '#BD10E0',
    },
    {
        id: 'dietRecommendation',
        title: 'Diet Recommendation',
        description: 'Nutritional guidance and meal impacts.',
        // icon: require('../../android/app/src/assets/images/blood_pressure_bg.png'), // Placeholder
        color: '#7ED321',
    },
    {
        id: 'medicalRecommendation',
        title: 'Medical Recommendation',
        description: 'Lifestyle and wellness advisor.',
        // icon: require('../../android/app/src/assets/images/medical_rec_placeholder.png'), // This will fail if not exist, let me check assets again
        color: '#D0021B',
    },
];

// Wait, let me re-check assets for better icons or just use common ones
// I'll use hi.png, agents.png, ai.png, dr.png, etc.

const AIModulesScreen = ({ navigation }) => {
    const modules = [
        {
            id: 'symptomChecker',
            title: 'Symptom Checker',
            description: 'General health assessment and symptom analysis.',
            // icon: require('../../android/app/src/assets/images/dr.png'),
            bgColor: '#E3F2FD',
            iconColor: '#1976D2',
            screen: 'Chat'
        },
        {
            id: 'predictiveAnalysis',
            title: 'Predictive Analysis',
            description: 'Forecast health trends based on your history.',
            // icon: require('../../android/app/src/assets/images/bar-chart.png'),
            bgColor: '#E8F5E9',
            iconColor: '#388E3C',
            screen: 'PredictiveAnalysis'
        },
        {
            id: 'anomalyDetection',
            title: 'Anomaly Detection',
            description: 'Identify unusual spikes or patterns in vitals.',
            // icon: require('../../android/app/src/assets/images/notification.png'),
            bgColor: '#FFF3E0',
            iconColor: '#F57C00',
            screen: 'AnomalyDetection'
        },
        {
            id: 'clinicalDecisionSupport',
            title: 'Clinical Support',
            description: 'Guidance based on medical protocols.',
            // icon: require('../../android/app/src/assets/images/agents.png'),
            bgColor: '#F3E5F5',
            iconColor: '#7B1FA2',
            screen: 'ClinicalDecisionSupport'
        },
        {
            id: 'dietRecommendation',
            title: 'Diet Recommendation',
            description: 'Nutritional guidance and meal impacts.',
            // icon: require('../../android/app/src/assets/images/bloodglucose.png'),
            bgColor: '#F1F8E9',
            iconColor: '#689F38',
            screen: 'DietRecommendation'
        },
        {
            id: 'medicalRecommendation',
            title: 'Medical Recommendation',
            description: 'Lifestyle and wellness advisor.',
            // icon: require('../../android/app/src/assets/images/hi.png'),
            bgColor: '#FFEBEE',
            iconColor: '#D32F2F',
            screen: 'MedicalRecommendation'
        },
    ];

    return (
        <View style={styles.fullScreenContainer}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY_BLUE} />

            <View style={styles.mainContainer}>
                {/* Header */}
                <View style={styles.topDarkSection}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerSpacer} />
                        <Text style={styles.headerTitle}>AI Modules Hub</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </View>

                {/* Modules List */}
                <View style={styles.bottomLightSection}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.sectionTitle}>Select AI Assistant</Text>
                        <Text style={styles.sectionSubtitle}>Choose a specialized AI to help manage your health.</Text>

                        <View style={styles.modulesGrid}>
                            {modules.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.moduleCard}
                                    onPress={() => navigation.navigate(item.screen)}
                                >
                                    {/* <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                                        <Image source={item.icon} style={[styles.icon, { tintColor: item.iconColor }]} resizeMode="contain" />
                                    </View> */}
                                    <Text style={styles.moduleTitle}>{item.title}</Text>
                                    <Text style={styles.moduleDesc} numberOfLines={2}>{item.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </View>
    );
};

export default AIModulesScreen;

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: NAVY_BLUE,
    },
    mainContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: NAVY_BLUE,
    },
    topDarkSection: {
        backgroundColor: NAVY_BLUE,
        height: scaleHeight(110),
        borderBottomLeftRadius: scaleWidth(35),
        borderBottomRightRadius: scaleWidth(35),
        paddingBottom: scaleHeight(10),
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scaleWidth(20),
        paddingTop: scaleHeight(20),
    },
    headerTitle: {
        fontSize: scaleFont(22),
        fontWeight: Platform.OS === 'ios' ? '900' : 'bold',
        color: WHITE,
        textAlign: 'center',
        flex: 1,
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
    bottomLightSection: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: scaleWidth(35),
        borderTopRightRadius: scaleWidth(35),
        marginTop: scaleWidth(-10),
        paddingTop: scaleWidth(30),
    },
    scrollContent: {
        paddingHorizontal: scaleWidth(20),
        paddingBottom: scaleHeight(40),
    },
    sectionTitle: {
        fontSize: scaleFont(20),
        fontWeight: '700',
        color: NAVY_BLUE,
        marginBottom: scaleHeight(5),
    },
    sectionSubtitle: {
        fontSize: scaleFont(14),
        color: '#64748B',
        marginBottom: scaleHeight(25),
    },
    modulesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    moduleCard: {
        backgroundColor: WHITE,
        width: '48%',
        borderRadius: scaleWidth(20),
        padding: scaleWidth(15),
        marginBottom: scaleHeight(15),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    iconContainer: {
        width: scaleWidth(50),
        height: scaleWidth(50),
        borderRadius: scaleWidth(15),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: scaleHeight(12),
    },
    icon: {
        width: scaleWidth(28),
        height: scaleWidth(28),
    },
    moduleTitle: {
        fontSize: scaleFont(16),
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: scaleHeight(6),
    },
    moduleDesc: {
        fontSize: scaleFont(12),
        color: '#94A3B8',
        lineHeight: scaleHeight(16),
    },
});
