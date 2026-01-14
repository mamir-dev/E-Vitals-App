/* FullTrendChartModal.js – Full Screen Chart Modal Component */
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const guidelineBaseWidth = 375;

// Responsive scaling
const scaleWidth = size => (screenWidth / guidelineBaseWidth) * size;
const scaleFont = size => scaleWidth(size);
const scaleHeight = size => (screenHeight / 812) * size;

/* ──────────────────────  COLORS  ────────────────────── */
const NAVY_BLUE = '#293d55';
const WHITE = '#FFFFFF';
const TEXT_LIGHT = '#666666';
const BORDER_GREY = '#E0E0E0';

/* ──────────────────────  FULL CHART MODAL COMPONENT  ────────────────────── */
const FullTrendChartModal = ({
    visible = false,
    onClose,
    measurements = [],
    dataType = 'bloodPressure',
    title = 'Trend Chart',
}) => {
    if (measurements.length === 0) {
        return null;
    }

    /* ───── CHART DATA PREPARATION ───── */
    const getChartData = () => {
        const targetCount = 10;
        const step = Math.max(1, Math.ceil(measurements.length / targetCount));

        const labels = measurements.map((m, index) => {
            if (index % step === 0 || index === measurements.length - 1) {
                return formatLabel(m.date);
            }
            return '';
        });

        return {
            labels: labels,
            datasets:
                dataType === 'bloodPressure'
                    ? [
                        {
                            data: measurements.map(m => m.systolic),
                            strokeWidth: 3,
                            color: () => NAVY_BLUE,
                        },
                        {
                            data: measurements.map(m => m.diastolic),
                            strokeWidth: 3,
                            color: () => '#EF4444',
                        },
                    ]
                    : [
                        {
                            data: measurements.map(m =>
                                dataType === 'bloodGlucose' ? m.glucose : m.weight
                            ),
                            color: () => NAVY_BLUE,
                            strokeWidth: 3,
                        },
                    ],
        };
    };

    const formatLabel = (dateStr) => {
        try {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const month = parts[0];
                const day = parts[1];
                return `${month}/${day}`;
            }
        } catch (e) {
            return dateStr;
        }
        return dateStr;
    };

    const chartData = getChartData();

    const chartConfig = {
        backgroundGradientFrom: WHITE,
        backgroundGradientTo: WHITE,
        decimalPlaces: 0,
        color: () => NAVY_BLUE,
        labelColor: () => TEXT_LIGHT,
        propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: NAVY_BLUE,
        },
        propsForLabels: {
            fontSize: 12,
            fontWeight: '600',
        },
        strokeWidth: 3,
        useShadowColorFromDataset: false,
    };

    // Width calculation ONLY for the LineChart component inside this modal
    // This does NOT affect any other styles or components
    const modalChartWidth = Math.max(screenWidth * 0.7, measurements.length * 30);

    return (
        <Modal
            transparent={false}
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.fullChartContainer}>
                <View style={styles.fullChartHeader}>
                    <Text style={styles.fullChartHeaderTitle}>{title}</Text>
                    <TouchableOpacity style={styles.fullChartCloseButton} onPress={onClose}>
                        <Text style={styles.fullChartCloseButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    style={styles.fullChartScrollView}
                    contentContainerStyle={styles.fullChartScrollContent}
                    showsHorizontalScrollIndicator={true}
                >
                    <View style={styles.fullChartChartContainer}>
                        <LineChart
                            data={chartData}
                            width={modalChartWidth}
                            height={screenHeight * 0.5}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.fullChartChart}
                            withHorizontalLines={true}
                            withVerticalLines={false}
                            fromZero={false}
                            segments={4}
                        />

                        {/* Legend for Blood Pressure */}
                        {dataType === 'bloodPressure' && (
                            <View style={styles.fullChartLegend}>
                                <View style={styles.fullChartLegendItem}>
                                    <View style={[styles.fullChartLegendDot, { backgroundColor: NAVY_BLUE }]} />
                                    <Text style={styles.fullChartLegendText}>Systolic</Text>
                                </View>
                                <View style={styles.fullChartLegendItem}>
                                    <View style={[styles.fullChartLegendDot, { backgroundColor: '#EF4444' }]} />
                                    <Text style={styles.fullChartLegendText}>Diastolic</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

/* ──────────────────────  STYLES  ────────────────────── */
const styles = StyleSheet.create({
    fullChartContainer: {
        flex: 1,
        backgroundColor: WHITE,
    },
    fullChartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scaleWidth(10),
        paddingVertical: scaleHeight(1),
        backgroundColor: NAVY_BLUE,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_GREY,
    },
    fullChartHeaderTitle: {
        fontSize: scaleFont(10),
        fontWeight: '600',
        color: WHITE,
        flex: 1,
    },
    fullChartCloseButton: {
        padding: scaleWidth(4),
        marginLeft: scaleWidth(6),
    },
    fullChartCloseButtonText: {
        fontSize: scaleFont(18),
        color: WHITE,
        fontWeight: '300',
    },
    fullChartScrollView: {
        flex: 1,
    },
    fullChartScrollContent: {
        padding: scaleWidth(20),
    },
    fullChartChartContainer: {
        backgroundColor: WHITE,
    },
    fullChartChart: {
        borderRadius: scaleWidth(8),
    },
    fullChartLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: scaleHeight(16),
        paddingVertical: scaleHeight(12),
        backgroundColor: '#F8F9FA',
        borderRadius: scaleWidth(8),
    },
    fullChartLegendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: scaleWidth(16),
    },
    fullChartLegendDot: {
        width: scaleWidth(6),
        height: scaleWidth(6),
        borderRadius: scaleWidth(6),
        marginRight: scaleWidth(8),
    },
    fullChartLegendText: {
        fontSize: scaleFont(6),
        color: TEXT_LIGHT,
        fontWeight: '600',
    },
});

export default FullTrendChartModal;
