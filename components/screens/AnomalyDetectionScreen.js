import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    StatusBar,
    SafeAreaView
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../config/globall';
import apiService from '../../services/apiService';

const NAVY_BLUE = colors.primaryButton || '#293d55';

const AnomalyDetectionScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [anomalies, setAnomalies] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnomalies();
    }, []);

    const fetchAnomalies = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get patient info from storage
            let patientId = await AsyncStorage.getItem('patientId');
            let practiceId = await AsyncStorage.getItem('practiceId');

            // Fallback if not in storage: fetch profile
            if (!patientId || !practiceId) {
                const profile = await apiService.getPatientProfile();
                if (profile && profile.patient) {
                    patientId = profile.patient.id;
                    practiceId = profile.patient.practice_id;
                    // Store for future use
                    await AsyncStorage.setItem('patientId', String(patientId));
                    await AsyncStorage.setItem('practiceId', String(practiceId));
                }
            }

            if (!patientId || !practiceId) {
                throw new Error("Could not identify patient/practice.");
            }

            const response = await apiService.getBloodPressureAnomalies(practiceId, patientId);
            setAnomalies(response.anomalies || []);

        } catch (err) {
            setError(err.message);
            console.error("Anomaly fetch error:", err);
            // Alert.alert("Error", "Failed to fetch anomalies.");
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{new Date(item.Date).toLocaleDateString()}</Text>
                <View style={[styles.badge, { backgroundColor: item.Severity_Score > 3 ? '#FF5252' : '#FFA726' }]}>
                    <Text style={styles.badgeText}>Severity: {item.Severity_Score}</Text>
                </View>
            </View>

            <View style={styles.readingRow}>
                <Text style={styles.readingLabel}>Blood Pressure:</Text>
                <Text style={styles.readingValue}>{item.SYS} / {item.DIA} mmHg</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.reasonLabel}>Anomaly Detected:</Text>
            <Text style={styles.reasonText}>{item.Anomaly_Reason}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY_BLUE} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Anomaly Detection</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={NAVY_BLUE} />
                    <Text style={styles.loadingText}>Analyzing health patterns...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchAnomalies} style={styles.retryButton}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : anomalies.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.successIcon}>✓</Text>
                    <Text style={styles.emptyText}>No anomalies detected.</Text>
                    <Text style={styles.subText}>Your blood pressure patterns look normal based on recent history.</Text>
                </View>
            ) : (
                <FlatList
                    data={anomalies}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        backgroundColor: NAVY_BLUE,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    backButton: {
        padding: 5,
        width: 40,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: '300',
        marginTop: -5,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    list: {
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
    errorText: {
        color: '#FF5252',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: NAVY_BLUE,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
    },
    subText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
    },
    successIcon: {
        fontSize: 60,
        color: '#4CAF50',
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#FF5252',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    readingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    readingLabel: {
        fontSize: 16,
        color: '#333',
    },
    readingValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginBottom: 12,
    },
    reasonLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    reasonText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
});

export default AnomalyDetectionScreen;
