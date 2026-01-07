import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, fonts } from '../../config/globall';

const { width, height } = Dimensions.get('window');

// 🔹 Scaling helpers
const baseWidth = 375;
const baseHeight = 812;
const scaleWidth = (size) => (width / baseWidth) * size;
const scaleHeight = (size) => (height / baseHeight) * size;
const scaleFont = (size) => scaleWidth(size);

/* ──────────────────────  COLORS  ────────────────────── */
const NAVY_BLUE = colors.primaryButton || '#293d55';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F4F7F9';
const BORDER_GREY = '#E0E0E0';
const TEXT_LIGHT = '#666666';

/* ──────────────────────  DROPDOWN OPTIONS  ────────────────────── */
const periodOptions = [
  'Last 7 days',
  'Last 2 weeks', 
  'Last month',
  'Last 90 Days',
  'Last year',
  'All',
];

const sortOptions = [
  'Weekly average',
  'Date (newest first)',
  'Date (oldest first)',
  'Systolic (highest first)',
  'Diastolic (highest first)',
  'Pulse (highest first)',
];

const weightSortOptions = [
  'Weekly average',
  'Date (newest first)',
  'Date (oldest first)',
  'Weight (highest first)',
  'Weight (lowest first)',
];

const glucoseSortOptions = [
  'Weekly average',
  'Date (newest first)',
  'Date (oldest first)',
  'Glucose (highest first)',
  'Glucose (lowest first)',
];

// Map period options to API values
const periodToApiValue = {
  'Last 7 days': 3,
  'Last 2 weeks': 2,
  'Last month': 1,
  'Last 90 Days': 5,
  'Last year': 4,
  'All': 6,
};

/* ──────────────────────  CUSTOM DROPDOWN  ────────────────────── */
const CustomDropdown = ({ visible, options, onSelect, onClose }) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.dropdownMenu}>
          <FlatList
            data={options}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.dropdownItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function SummaryScreen({ navigation, route }) {
  const [activeChart, setActiveChart] = useState('bloodPressure');
  const [selectedPeriod, setSelectedPeriod] = useState('Last 7 days');
  const [sortBy, setSortBy] = useState('Weekly average');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateRangeType, setDateRangeType] = useState('range');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  useEffect(() => {
    if (route.params?.chartType) {
      setActiveChart(route.params.chartType);
    }
    fetchPatientData();
  }, [route.params]);

  const fetchPatientData = async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setPatientId(user.id);
        fetchGraphData(user.id, periodToApiValue[selectedPeriod], dateRangeType);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setIsLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const fetchGraphData = async (id, dateRangeValue, isQuickSelect, startDate = null, endDate = null) => {
    try {
      console.log("📡 Fetching graph data for patient ID:", id);
      console.log("📅 Date range value:", dateRangeValue);

      const token = await AsyncStorage.getItem('authToken');
      console.log("🔑 Token loaded:", token ? "Yes" : "No");
      
      // Build URL with query parameters
      let url;
      if (isQuickSelect === 'range') {
          url = `https://evitals.life/api/blood-pressure-graph/${id}?radioIDBloodPressure=date_range&dateRange=${dateRangeValue}`;
      } else {
          url = `https://evitals.life/api/blood-pressure-graph/${id}?radioIDBloodPressure=date&start_date=${startDate}&end_date=${endDate}`;
      }
      
      // Add custom date range if selected
      if (dateRangeValue === 7 && fromDate && toDate) {
        url += `&fromDate=${fromDate}&toDate=${toDate}`;
        console.log("📆 Custom date range API URL:", url);
      } else if (dateRangeValue === 7 && (!fromDate || !toDate)) {
        console.log("⚠️ Custom range selected but dates are missing");
        Alert.alert('Error', 'Please select both start and end dates for custom range');
        setIsLoading(false);
        return;
      } else {
        console.log("🌍 API URL:", url);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        console.error("❌ Failed to fetch graph data. Status:", response.status);
        throw new Error('Failed to fetch graph data');
      }

      const data = await response.json();
      console.log("✅ API Response Data received");
      
      setApiData(data);
    } catch (error) {
      console.error("🔥 Error fetching graph data:", error);
      Alert.alert('Error', 'Failed to load graph data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate properly spaced Y-axis values for blood pressure (0-200 mmHg)
  const generateYAxisValues = () => {
    const values = [];
    for (let i = 0; i <= 200; i += 20) {
      values.push(i);
    }
    return values.reverse();
  };

  const getChartData = () => {
    const yAxisValues = generateYAxisValues();
    const defaultData = {
      bloodPressure: {
        title: 'Blood Pressure',
        trend: { systolic: [], diastolic: [] },
        mean: { systolic: [], diastolic: [] },
        colors: { primary: NAVY_BLUE, secondary: '#EF4444' },
        yAxis: yAxisValues,
        xAxis: []
      },
      bloodGlucose: {
        title: 'Blood Glucose',
        trend: { glucose: [] },
        mean: { glucose: [] },
        colors: { primary: NAVY_BLUE },
        yAxis: [200, 150, 100, 50, 0],
        xAxis: []
      },
      weight: {
        title: 'Weight',
        trend: { weight: [] },
        mean: { weight: [] },
        colors: { primary: NAVY_BLUE },
        yAxis: [200, 175, 150, 125, 100],
        xAxis: []
      },
    };

    if (!apiData || activeChart !== 'bloodPressure') {
      return defaultData[activeChart];
    }

    // Process API data for blood pressure chart - Trend Chart
    const trendDates = apiData.data?.dailyTrendDate || [];
    const systolicData = apiData.data?.dailyTrendGraphData?.systolic || [];
    const diastolicData = apiData.data?.dailyTrendGraphData?.diastolic || [];
    
    // Create aligned arrays where each date has corresponding data
    const alignedSystolic = [];
    const alignedDiastolic = [];
    
    trendDates.forEach((date, index) => {
      if (index < systolicData.length) {
        const num = parseFloat(systolicData[index]);
        alignedSystolic.push(isNaN(num) ? 0 : num);
      } else {
        alignedSystolic.push(0);
      }
      
      if (index < diastolicData.length) {
        const num = parseFloat(diastolicData[index]);
        alignedDiastolic.push(isNaN(num) ? 0 : num);
      } else {
        alignedDiastolic.push(0);
      }
    });

    const trendData = {
      systolic: alignedSystolic,
      diastolic: alignedDiastolic
    };

    // Process API data for blood pressure chart - Mean Chart
    let meanData = { systolic: [], diastolic: [] };
    if (apiData.data?.MeanChart && Array.isArray(apiData.data.MeanChart) && apiData.data.MeanChart.length > 0) {
      meanData = {
        systolic: apiData.data.MeanChart.map(item => {
          const num = parseFloat(item.avgOfSystolic || 0);
          return isNaN(num) ? 0 : num;
        }),
        diastolic: apiData.data.MeanChart.map(item => {
          const num = parseFloat(item.avgOfDiastolic || 0);
          return isNaN(num) ? 0 : num;
        })
      };
    }

    // Get X-axis labels for trend chart
    let trendXAxis = [];
    if (trendDates && Array.isArray(trendDates)) {
      const step = Math.max(1, Math.ceil(trendDates.length / 7));
      trendXAxis = trendDates.filter((_, index) => index % step === 0 || index === trendDates.length - 1);
    }

    // Get X-axis labels for mean chart
    let meanXAxis = [];
    if (apiData.data?.xAxisData && Array.isArray(apiData.data.xAxisData)) {
      meanXAxis = apiData.data.xAxisData.map(item => item.hAxis || '');
    }

    return {
      title: 'Blood Pressure',
      trend: trendData,
      mean: meanData,
      colors: { primary: NAVY_BLUE, secondary: '#EF4444' },
      yAxis: yAxisValues,
      trendXAxis: trendXAxis,
      meanXAxis: meanXAxis,
      allTrendDates: trendDates
    };
  };

  const getSortOptions = () => {
    switch (activeChart) {
      case 'bloodPressure':
        return sortOptions;
      case 'bloodGlucose':
        return glucoseSortOptions;
      case 'weight':
        return weightSortOptions;
      default:
        return sortOptions;
    }
  };

  const createPath = (data, chartH, minValue, maxValue) => {
    if (!data || data.length === 0) return '';
    
    const validData = Array.isArray(data) 
      ? data.map(val => {
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        })
      : [0];
    
    const xDivisor = Math.max(1, validData.length - 1);
    const range = maxValue - minValue;
    const effectiveRange = range === 0 ? 1 : range;

    return validData
      .map((value, index) => {
        const x = (index / xDivisor) * scaleWidth(250);
        const y = chartH - ((value - minValue) / effectiveRange) * chartH;
        
        return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
      })
      .join(' ');
  };

  const renderXAxis = (xAxisData, isMeanChart = false) => {
    if (!xAxisData || xAxisData.length === 0) return null;
    
    return (
      <View style={styles.xAxis}>
        {xAxisData.map((label, index) => {
          let formattedLabel = label;
          try {
            if (!isMeanChart && label.includes('/')) {
              const dateParts = label.split('/');
              formattedLabel = `${dateParts[1]}/${dateParts[2]}`;
            }
            else if (isMeanChart && label.includes('~')) {
              const timeParts = label.split('~');
              formattedLabel = timeParts[0].trim();
            }
          } catch (error) {
            console.error('Error formatting label:', error);
          }
          
          return (
            <Text key={index} style={styles.xAxisLabel}>
              {formattedLabel}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderChart = (data, isMeanChart = false) => {
    if (isLoading) {
      return (
        <View style={styles.chartContainer}>
          <ActivityIndicator size="large" color={NAVY_BLUE} />
        </View>
      );
    }

    const chartHeight = scaleHeight(150);
    const currentChart = getChartData();
    const xAxisData = isMeanChart ? currentChart.meanXAxis : currentChart.trendXAxis;
    
    const maxVal = 200;
    const minVal = 0;

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>
          <View style={styles.yAxis}>
            {currentChart.yAxis.map((value, index) => {
              const y = chartHeight - ((value - minVal) / (maxVal - minVal)) * chartHeight;
              return (
                <Text
                  key={`${value}-${index}`}
                  style={[styles.yAxisLabel, { position: 'absolute', top: y - 6 }]}
                >
                  {value}
                </Text>
              );
            })}
          </View>
          <View style={styles.chart}>
            <Svg height={chartHeight} width="100%">
              {/* Horizontal grid lines */}
              {currentChart.yAxis.map((value, i) => {
                const y = chartHeight - ((value - minVal) / (maxVal - minVal)) * chartHeight;
                return (
                  <Line
                    key={i}
                    x1="0"
                    y1={y}
                    x2={scaleWidth(250)}
                    y2={y}
                    stroke={BORDER_GREY}
                    strokeWidth="1"
                  />
                );
              })}

              {activeChart === 'bloodPressure' && data && data.systolic && data.diastolic && data.systolic.length > 0 && data.diastolic.length > 0 && (
                <>
                  <Path
                    d={createPath(data.systolic, chartHeight, minVal, maxVal)}
                    fill="none"
                    stroke={currentChart.colors.primary}
                    strokeWidth="2"
                  />
                  <Path
                    d={createPath(data.diastolic, chartHeight, minVal, maxVal)}
                    fill="none"
                    stroke={currentChart.colors.secondary}
                    strokeWidth="2"
                  />
                </>
              )}

              {(activeChart === 'bloodGlucose' || activeChart === 'weight') && data && (
                <Path
                  d={createPath(
                    activeChart === 'bloodGlucose' ? data.glucose : data.weight,
                    chartHeight,
                    minVal,
                    maxVal
                  )}
                  fill="none"
                  stroke={currentChart.colors.primary}
                  strokeWidth="2"
                />
              )}
            </Svg>
          </View>
        </View>
        {xAxisData && xAxisData.length > 0 ? (
          renderXAxis(xAxisData, isMeanChart)
        ) : (
          <Text style={styles.noDataText}>No data available</Text>
        )}
      </View>
    );
  };

  const handleQuery = () => {
    if (patientId) {
      setIsLoading(true);
      const dateRangeValue = periodToApiValue[selectedPeriod];
      console.log("🚀 Querying with date range:", selectedPeriod, "API value:", dateRangeValue);
      
      if (dateRangeValue === 7 && (!fromDate || !toDate)) {
        console.log("❌ Missing dates for custom range");
        Alert.alert('Error', 'Please select both start and end dates for custom range');
        setIsLoading(false);
        return;
      }
      
      fetchGraphData(patientId, dateRangeValue, dateRangeType, fromDate, toDate);
    }
  };

  const handleFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      const formattedDate = formatDateForAPI(selectedDate);
      setFromDate(formattedDate);
    }
  };

  const handleToDateChange = (event, selectedDate) => {
    setShowToDatePicker(false);
    if (selectedDate) {
      const formattedDate = formatDateForAPI(selectedDate);
      setToDate(formattedDate);
    }
  };

  const getTitle = () => ({
    bloodPressure: 'Blood Pressure',
    bloodGlucose: 'Blood Glucose',
    weight: 'Weight',
  })[activeChart] || 'Summary';

  const currentChart = getChartData();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="default" />

      {/* Main Container with Navy Blue Background */}
      <View style={styles.mainContainer}>
        {/* Header - Navy Blue Bar */}
        <View style={styles.topDarkSection}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getTitle()}</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* White section (Body section) */}
        <View style={styles.bottomLightSection}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {/* Query Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Query Period</Text>

              <View style={styles.row}>
                <TouchableOpacity style={styles.radio} onPress={() => setDateRangeType('range')}>
                  <View style={[styles.radioCircle, dateRangeType === 'range' && styles.radioActive]} />
                  <Text style={styles.radioLabel}>Quick Select</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dropdown, dateRangeType !== 'range' && styles.disabled]}
                  disabled={dateRangeType !== 'range'}
                  onPress={() => setShowPeriodModal(true)}>
                  <Text style={styles.dropdownText}>{selectedPeriod}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TouchableOpacity style={styles.radio} onPress={() => setDateRangeType('custom')}>
                  <View style={[styles.radioCircle, dateRangeType === 'custom' && styles.radioActive]} />
                  <Text style={styles.radioLabel}>Custom Range</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateRow}>
                <TouchableOpacity 
                  style={[styles.dateInput, dateRangeType !== 'custom' && styles.disabled]}
                  onPress={() => dateRangeType === 'custom' && setShowFromDatePicker(true)}
                >
                  <Text style={fromDate ? styles.dateText : styles.placeholderText}>
                    {fromDate ? formatDateForDisplay(new Date(fromDate)) : 'mm/dd/yyyy'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.to}>to</Text>
                <TouchableOpacity 
                  style={[styles.dateInput, dateRangeType !== 'custom' && styles.disabled]}
                  onPress={() => dateRangeType === 'custom' && setShowToDatePicker(true)}
                >
                  <Text style={toDate ? styles.dateText : styles.placeholderText}>
                    {toDate ? formatDateForDisplay(new Date(toDate)) : 'mm/dd/yyyy'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showFromDatePicker && (
                <DateTimePicker
                  value={fromDate ? new Date(fromDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleFromDateChange}
                />
              )}

              {showToDatePicker && (
                <DateTimePicker
                  value={toDate ? new Date(toDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={handleToDateChange}
                />
              )}

              <TouchableOpacity style={styles.queryBtn} onPress={handleQuery}>
                <Text style={styles.queryBtnText}>Query</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.chartTitle}>Daily Trend Chart</Text>
            {renderChart(currentChart.trend, false)}

            <Text style={styles.chartTitle}>Measurement Period Chart</Text>
            {renderChart(currentChart.mean, true)}
          </ScrollView>
        </View>
      </View>

      {/* Dropdowns */}
      <CustomDropdown
        options={periodOptions}
        onSelect={(value) => {
          setSelectedPeriod(value);
          setDateRangeType('range');
        }}
        visible={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
      />
      <CustomDropdown
        options={getSortOptions()}
        onSelect={setSortBy}
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: NAVY_BLUE 
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: NAVY_BLUE,
  },
  scroll: { 
    flex: 1 
  },
  content: { 
    padding: scaleWidth(16) 
  },

  // --- Header Styles ---
  topDarkSection: {
    backgroundColor: NAVY_BLUE,
    height: scaleHeight(100),
    borderBottomLeftRadius: scaleWidth(35),
    borderBottomRightRadius: scaleWidth(35),
    paddingBottom: scaleHeight(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleHeight(10),
  },
  backButton: {
    padding: 10, 
    justifyContent: 'center',
    alignItems: 'left',
    minHeight: 55,
    minWidth: 55,
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
        fontFamily: 'sans-serif-condensed',
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
    marginTop: scaleWidth(-15),
    paddingTop: scaleWidth(20),
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: scaleWidth(10),
    padding: scaleWidth(16),
    marginBottom: scaleHeight(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { 
    fontSize: scaleFont(18),
    fontWeight: '700', 
    color: NAVY_BLUE, 
    marginBottom: scaleHeight(12),
  },

  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: scaleHeight(12), 
    justifyContent: 'space-between' 
  },
  radio: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  radioCircle: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    borderWidth: scaleWidth(2),
    borderColor: NAVY_BLUE,
    marginRight: scaleWidth(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { 
    backgroundColor: NAVY_BLUE 
  },
  radioLabel: { 
    fontSize: scaleFont(14), 
    color: TEXT_LIGHT,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(8),
    marginLeft: scaleWidth(12),
    borderWidth: scaleWidth(1),
    borderColor: BORDER_GREY,
  },
  disabled: { 
    opacity: 0.5 
  },
  dropdownText: { 
    fontSize: scaleFont(14), 
    color: NAVY_BLUE,
    fontWeight: '600',
  },

  dateRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: scaleHeight(12) 
  },
  dateInput: {
    flex: 1,
    backgroundColor: WHITE,
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(10),
    borderRadius: scaleWidth(8),
    fontSize: scaleFont(14),
    marginHorizontal: scaleWidth(4),
    borderWidth: scaleWidth(1),
    borderColor: BORDER_GREY,
    justifyContent: 'center',
    height: scaleHeight(40),
  },
  dateText: { 
    fontSize: scaleFont(14), 
    color: NAVY_BLUE,
    fontWeight: '600',
  },
  placeholderText: { 
    fontSize: scaleFont(14), 
    color: TEXT_LIGHT 
  },
  to: { 
    fontSize: scaleFont(14), 
    color: TEXT_LIGHT, 
    marginHorizontal: scaleWidth(8) 
  },

  queryBtn: {
    backgroundColor: NAVY_BLUE,
    paddingVertical: scaleHeight(12),
    borderRadius: scaleWidth(12),
    alignItems: 'center',
    marginTop: scaleHeight(8),
    borderWidth: scaleWidth(1),
    borderColor: NAVY_BLUE,
  },
  queryBtnText: { 
    color: WHITE, 
    fontWeight: '600', 
    fontSize: scaleFont(15) 
  },

  chartTitle: { 
    fontSize: scaleFont(16), 
    fontWeight: '600', 
    color: NAVY_BLUE, 
    marginTop: scaleHeight(24), 
    marginBottom: scaleHeight(8) 
  },
  chartWrapper: { 
    marginBottom: scaleHeight(16), 
    backgroundColor: WHITE, 
    borderRadius: scaleWidth(8), 
    padding: scaleWidth(16), 
    borderWidth: scaleWidth(1),
    borderColor: BORDER_GREY,
  },
  chartContainer: { 
    flexDirection: 'row', 
    height: scaleHeight(160) 
  },
  yAxis: { 
    width: scaleWidth(45), 
    position: 'relative' 
  },
  yAxisLabel: { 
    fontSize: scaleFont(10), 
    color: TEXT_LIGHT, 
    textAlign: 'right', 
    paddingRight: scaleWidth(4),
    height: scaleHeight(16) 
  },
  chart: { 
    flex: 1, 
    borderWidth: scaleWidth(1), 
    borderColor: BORDER_GREY, 
    borderRadius: scaleWidth(8), 
    padding: scaleWidth(8), 
    paddingRight: scaleWidth(12)
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleHeight(18),
    marginLeft: scaleWidth(45),
    paddingRight: scaleWidth(8),
  },
  xAxisLabel: { 
    fontSize: scaleFont(10), 
    color: TEXT_LIGHT 
  },
  noDataText: { 
    textAlign: 'center', 
    marginTop: scaleHeight(8), 
    color: TEXT_LIGHT 
  },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  dropdownMenu: {
    backgroundColor: WHITE,
    borderRadius: scaleWidth(16),
    width: width * 0.85,
    maxHeight: scaleHeight(300),
    padding: scaleWidth(8),
    borderWidth: scaleWidth(1),
    borderColor: BORDER_GREY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: { 
    padding: scaleHeight(14), 
    borderBottomWidth: scaleWidth(1), 
    borderColor: BORDER_GREY,
    backgroundColor: WHITE,
  },
  dropdownItemText: { 
    fontSize: scaleFont(15), 
    color: NAVY_BLUE,
    fontWeight: '600',
  },
});