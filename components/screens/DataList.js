/*  DataList.js – PROFESSIONAL MEDICAL UI (BP, BG, Weight)  */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Functions to make design responsive
const scaleWidth = size => (width / guidelineBaseWidth) * size;
const scaleHeight = size => (height / guidelineBaseHeight) * size;
const scaleFont = size => scaleWidth(size);

/* ──────────────────────  COLORS  ────────────────────── */
const NAVY_BLUE = '#11224D';
const WHITE = '#FFFFFF';
const LIGHT_GREY = '#F4F7F9';
const BORDER_GREY = '#E0E0E0';
const TEXT_LIGHT = '#666666';
const colors = {
  primary: NAVY_BLUE,
  primaryLight: LIGHT_GREY,
  text: '#1A1A1A',
  textLight: TEXT_LIGHT,
  border: BORDER_GREY,
  background: '#F8FAFC',
  white: WHITE,
  danger: '#EF4444',
  success: '#10B981',
};

/* ──────────────────────  DROPDOWN OPTIONS  ────────────────────── */
const periodOptions = ['Last 7 days', 'Last 2 weeks', 'Last month', 'Last 3 months', 'Last 6 months', 'Last year', 'Custom range'];
const sortOptions = {
  bloodPressure: ['Date (newest first)', 'Date (oldest first)', 'Systolic (high-low)', 'Diastolic (high-low)', 'Pulse (high-low)'],
  bloodGlucose: ['Date (newest first)', 'Date (oldest first)', 'Glucose (high-low)', 'Glucose (low-high)'],
  weight: ['Date (newest first)', 'Date (oldest first)', 'Weight (high-low)', 'Weight (low-high)'],
};

/* ──────────────────────  CUSTOM DROPDOWN  ────────────────────── */
const CustomDropdown = ({ visible, options, onSelect, onClose }) => {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.dropdownMenu}>
          {options.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}>
              <Text style={styles.dropdownItemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

/* ──────────────────────  MAIN COMPONENT  ────────────────────── */
const DataList = ({ navigation, route }) => {
  const { dataType = 'bloodPressure' } = route.params || {};

  const [selectedPeriod, setSelectedPeriod] = useState('Last 7 days');
  const [sortBy, setSortBy] = useState('Date (newest first)');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateRangeType, setDateRangeType] = useState('range');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ───── DATE FILTER LOGIC ───── */
  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (selectedPeriod === 'Last 7 days') {
      start.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'Last 2 weeks') {
      start.setDate(now.getDate() - 14);
    } else if (selectedPeriod === 'Last month') {
      start.setMonth(now.getMonth() - 1);
    } else if (selectedPeriod === 'Last 3 months') {
      start.setMonth(now.getMonth() - 3);
    } else if (selectedPeriod === 'Last 6 months') {
      start.setMonth(now.getMonth() - 6);
    } else if (selectedPeriod === 'Last year') {
      start.setFullYear(now.getFullYear() - 1);
    } else if (selectedPeriod === 'Custom range' && fromDate && toDate) {
      start = new Date(fromDate);
      end = new Date(toDate);
    }

    return { start, end };
  };

  /* ───── SORT LOGIC ───── */
  const sortData = (data) => {
    const sorted = [...data];
    if (sortBy === 'Date (newest first)') {
      sorted.sort((a, b) => new Date(b.id) - new Date(a.id));
    } else if (sortBy === 'Date (oldest first)') {
      sorted.sort((a, b) => new Date(a.id) - new Date(b.id));
    } else if (sortBy === 'Systolic (high-low)') {
      sorted.sort((a, b) => b.systolic - a.systolic);
    } else if (sortBy === 'Diastolic (high-low)') {
      sorted.sort((a, b) => b.diastolic - a.diastolic);
    } else if (sortBy === 'Pulse (high-low)') {
      sorted.sort((a, b) => b.pulse - a.pulse);
    } else if (sortBy === 'Glucose (high-low)') {
      sorted.sort((a, b) => b.glucose - a.glucose);
    } else if (sortBy === 'Weight (high-low)') {
      sorted.sort((a, b) => b.weight - a.weight);
    }
    return sorted;
  };

  /* ───── FETCH & FILTER DATA ───── */
  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await AsyncStorage.getItem('user');
      if (!userData) throw new Error('User not found');
      const user = JSON.parse(userData);
      const patientId = user.id || user.patient_id;
      if (!patientId) throw new Error('Patient ID missing');

      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Auth token missing');

      const response = await fetch(`https://evitals.life/api/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const result = await response.json();
      if (!result.success || !result.data) throw new Error('Invalid response');

      const data = result.data;
      const rawList = [];

      const { start, end } = getDateRange();

      // Blood Pressure
      if (dataType === 'bloodPressure' && data.measurements?.bloodPressure) {
        const bp = data.measurements.bloodPressure;
        const date = new Date(bp.measure_new_date_time);
        if (date >= start && date <= end) {
          rawList.push({
            id: bp.measure_new_date_time,
            date: formatDate(bp.measure_new_date_time),
            time: formatTime(bp.measure_new_date_time),
            systolic: parseFloat(bp.systolic || bp.systolic_pressure || 0),
            diastolic: parseFloat(bp.diastolic || bp.diastolic_pressure || 0),
            pulse: parseFloat(bp.pulse || bp.heart_rate || 0),
          });
        }
      }

      // Blood Glucose
      if (dataType === 'bloodGlucose' && data.measurements?.bloodGlucose) {
        const bg = data.measurements.bloodGlucose;
        const date = new Date(bg.measure_new_date_time);
        if (date >= start && date <= end) {
          rawList.push({
            id: bg.measure_new_date_time,
            date: formatDate(bg.measure_new_date_time),
            time: formatTime(bg.measure_new_date_time),
            glucose: parseFloat(bg.blood_glucose_value_1 || 0),
          });
        }
      }

      // Weight
      if (dataType === 'weight' && data.measurements?.weight) {
        const w = data.measurements.weight;
        const date = new Date(w.measure_new_date_time);
        if (date >= start && date <= end) {
          let value = parseFloat(w.value || w.weight_value || w.weight || 0);
          const unit = (w.unit || w.measurement_unit || 'kg').toLowerCase();
          if (unit === 'kg') value = (value * 2.20462).toFixed(1);
          rawList.push({
            id: w.measure_new_date_time,
            date: formatDate(w.measure_new_date_time),
            time: formatTime(w.measure_new_date_time),
            weight: value,
            unit: unit === 'kg' ? 'lb' : unit,
          });
        }
      }

      const sorted = sortData(rawList);
      setMeasurements(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dataType, selectedPeriod, sortBy, fromDate, toDate]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  /* ───── HELPERS ───── */
  const formatDate = (iso) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(2)}`;
  };

  const formatTime = (iso) => {
    if (!iso) return '--';
    const d = new Date(iso);
    const h = d.getHours() % 12 || 12;
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  };

  const getTitle = () => ({
    bloodPressure: 'Blood Pressure',
    bloodGlucose: 'Blood Glucose',
    weight: 'Weight',
  })[dataType] || 'Data';

  /* ───── CHART DATA ───── */
  const chartData = {
    labels: measurements.map(m => m.date.split('/')[1]),
    datasets:
      dataType === 'bloodPressure'
        ? [
            { data: measurements.map(m => m.systolic), strokeWidth: 3, color: () => NAVY_BLUE },
            { data: measurements.map(m => m.diastolic), strokeWidth: 3, color: () => '#EF4444' },
          ]
        : [
            {
              data: measurements.map(m => dataType === 'bloodGlucose' ? m.glucose : m.weight),
              color: () => NAVY_BLUE,
              strokeWidth: 3,
            },
          ],
  };

  const chartConfig = {
    backgroundGradientFrom: WHITE,
    backgroundGradientTo: WHITE,
    decimalPlaces: 0,
    color: () => NAVY_BLUE,
    labelColor: () => TEXT_LIGHT,
    propsForDots: { r: '5', strokeWidth: '2', stroke: NAVY_BLUE },
    propsForLabels: { fontSize: 10 },
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <StatusBar backgroundColor={NAVY_BLUE} barStyle="light-content" /> */}
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
                <TextInput
                  style={[styles.dateInput, dateRangeType !== 'custom' && styles.disabled]}
                  placeholder="mm/dd/yyyy"
                  value={fromDate}
                  editable={dateRangeType === 'custom'}
                  onChangeText={setFromDate}
                  placeholderTextColor={TEXT_LIGHT}
                />
                <Text style={styles.to}>to</Text>
                <TextInput
                  style={[styles.dateInput, dateRangeType !== 'custom' && styles.disabled]}
                  placeholder="mm/dd/yyyy"
                  value={toDate}
                  editable={dateRangeType === 'custom'}
                  onChangeText={setToDate}
                  placeholderTextColor={TEXT_LIGHT}
                />
              </View>

              <View style={styles.row}>
                <Text style={styles.sortLabel}>Sort Data by</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowSortModal(true)}>
                  <Text style={styles.dropdownText}>{sortBy}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.queryBtn} onPress={fetchPatientData}>
                <Text style={styles.queryBtnText}>Query</Text>
              </TouchableOpacity>
            </View>

            {/* Trend Chart */}
            {measurements.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Trend</Text>
                <LineChart
                  data={chartData}
                  width={width - 60}
                  height={240}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withHorizontalLines={true}
                  withVerticalLines={false}
                  fromZero={false}
                />
                {dataType === 'bloodPressure' && (
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: NAVY_BLUE }]} />
                      <Text style={styles.legendText}>Systolic</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                      <Text style={styles.legendText}>Diastolic</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Table */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{getTitle()}</Text>
              <Text style={styles.subtitle}>Date Range: {selectedPeriod}</Text>

              {loading ? (
                <ActivityIndicator size="large" color={NAVY_BLUE} style={{ marginVertical: 30 }} />
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : measurements.length === 0 ? (
                <Text style={styles.emptyText}>No data available</Text>
              ) : (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.colDate]}>Date</Text>
                    <Text style={[styles.th, styles.colTime]}>Time</Text>
                    {dataType === 'bloodPressure' ? (
                      <>
                        <Text style={[styles.th, styles.colValue]}>Sys</Text>
                        <Text style={[styles.th, styles.colValue]}>Dia</Text>
                        <Text style={[styles.th, styles.colValue]}>Pulse</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.th, styles.colValue]}>{dataType === 'bloodGlucose' ? 'Glucose' : 'Weight'}</Text>
                        <Text style={[styles.th, styles.colUnit]}>Unit</Text>
                      </>
                    )}
                  </View>

                  {measurements.map((item) => (
                    <View key={item.id} style={styles.tableRow}>
                      <Text style={[styles.td, styles.colDate]}>{item.date}</Text>
                      <Text style={[styles.td, styles.colTime]}>{item.time}</Text>
                      {dataType === 'bloodPressure' ? (
                        <>
                          <Text style={[styles.td, styles.colValue, item.systolic > 140 && styles.danger]}>
                            {item.systolic}
                          </Text>
                          <Text style={[styles.td, styles.colValue, item.diastolic > 90 && styles.danger]}>
                            {item.diastolic}
                          </Text>
                          <Text style={[styles.td, styles.colValue]}>{item.pulse}</Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.td, styles.colValue]}>
                            {dataType === 'bloodGlucose' ? item.glucose : item.weight}
                          </Text>
                          <Text style={[styles.td, styles.colUnit]}>
                            {dataType === 'bloodGlucose' ? 'mg/dL' : item.unit || 'lb'}
                          </Text>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Modals */}
      <CustomDropdown
        visible={showPeriodModal}
        options={periodOptions}
        onSelect={setSelectedPeriod}
        onClose={() => setShowPeriodModal(false)}
      />
      <CustomDropdown
        visible={showSortModal}
        options={sortOptions[dataType] || []}
        onSelect={setSortBy}
        onClose={() => setShowSortModal(false)}
      />
    </SafeAreaView>
  );
};

/* ──────────────────────  STYLES  ────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY_BLUE },
  mainContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: NAVY_BLUE,
  },
  scroll: { flex: 1 },
  content: { padding: 16 },

  // --- Header Styles ---
  topDarkSection: {
    backgroundColor: NAVY_BLUE,
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
    padding: scaleWidth(8),
    marginRight: scaleWidth(10),
  },
  backButtonText: {
    fontSize: scaleFont(28),
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: scaleFont(24),
    fontWeight: '800',
    color: 'white',
    textAlign: 'left',
    flex: 1,
    marginLeft: scaleWidth(5),
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
    marginTop: -scaleWidth(15),
    paddingTop: scaleWidth(20),
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER_GREY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: { 
    fontSize: 17, 
    fontWeight: '600', 
    color: NAVY_BLUE, 
    marginBottom: 12 
  },
  subtitle: { fontSize: 13, color: TEXT_LIGHT, marginBottom: 12 },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' },
  radio: { flexDirection: 'row', alignItems: 'center' },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: NAVY_BLUE,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { backgroundColor: NAVY_BLUE },
  radioLabel: { fontSize: 14, color: colors.text },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: BORDER_GREY,
  },
  disabled: { opacity: 0.5 },
  dropdownText: { fontSize: 14, color: colors.text },

  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dateInput: {
    flex: 1,
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: BORDER_GREY,
    color: colors.text,
  },
  to: { fontSize: 14, color: TEXT_LIGHT, marginHorizontal: 8 },

  sortLabel: { fontSize: 14, color: colors.text, width: 100 },
  queryBtn: {
    backgroundColor: NAVY_BLUE,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: NAVY_BLUE,
  },
  queryBtnText: { color: WHITE, fontWeight: '600', fontSize: 15 },

  chart: { borderRadius: 12, marginVertical: 8 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: TEXT_LIGHT },

  table: { 
    borderWidth: 1, 
    borderColor: BORDER_GREY, 
    borderRadius: 12, 
    overflow: 'hidden',
    backgroundColor: WHITE,
  },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: LIGHT_GREY, 
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GREY,
  },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderColor: BORDER_GREY,
    backgroundColor: WHITE,
  },
  th: { fontWeight: '600', fontSize: 12, color: NAVY_BLUE },
  td: { fontSize: 13, color: colors.text },
  colDate: { width: '22%', paddingLeft: 12 },
  colTime: { width: '22%', textAlign: 'center' },
  colValue: { width: '18%', textAlign: 'center' },
  colUnit: { width: '18%', textAlign: 'center' },
  danger: { color: colors.danger, fontWeight: '600' },

  emptyText: { textAlign: 'center', color: TEXT_LIGHT, fontSize: 15, marginVertical: 20 },
  errorText: { textAlign: 'center', color: colors.danger, fontSize: 14, marginVertical: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenu: {
    backgroundColor: WHITE,
    borderRadius: 16,
    width: width * 0.85,
    maxHeight: 300,
    padding: 8,
    borderWidth: 1,
    borderColor: BORDER_GREY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: { 
    padding: 14, 
    borderBottomWidth: 1, 
    borderColor: BORDER_GREY,
    backgroundColor: WHITE,
  },
  dropdownItemText: { fontSize: 15, color: colors.text },
});

export default DataList;