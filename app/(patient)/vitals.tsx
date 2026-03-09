import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Button, TextInput, FAB, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGetHealthVitalsQuery, useAddHealthVitalMutation } from '../../src/store/apiSlice';
import { AppCard, AppHeader, EmptyState, LoadingScreen } from '../../src/components';
import { formatDate } from '../../src/utils/formatters';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';
import type { HealthVital } from '../../src/types';

const vitalTypes = [
  { value: 'blood_pressure', label: 'BP', icon: 'heart-pulse', color: Colors.error, unit: 'mmHg' },
  { value: 'blood_sugar', label: 'Sugar', icon: 'water-outline', color: Colors.warning, unit: 'mg/dL' },
  { value: 'weight', label: 'Weight', icon: 'scale-bathroom', color: Colors.primary, unit: 'kg' },
  { value: 'temperature', label: 'Temp', icon: 'thermometer', color: Colors.accent, unit: '°F' },
  { value: 'heart_rate', label: 'HR', icon: 'heart-outline', color: Colors.success, unit: 'bpm' },
];

export default function HealthVitalsScreen() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading, refetch } = useGetHealthVitalsQuery(
    filter === 'all' ? {} : { type: filter },
  );
  const [addVital, { isLoading: adding }] = useAddHealthVitalMutation();
  const vitals: HealthVital[] = data?.data || [];

  const [modalVisible, setModalVisible] = useState(false);
  const [newType, setNewType] = useState('blood_pressure');
  const [newValue, setNewValue] = useState('');
  const selectedVital = vitalTypes.find((v) => v.value === newType);

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    const vt = vitalTypes.find((v) => v.value === newType);
    await addVital({ type: newType, value: newValue, unit: vt?.unit || '' });
    setModalVisible(false);
    setNewValue('');
    refetch();
  };

  const filterOptions = ['all', ...vitalTypes.map((v) => v.value)];

  if (isLoading && vitals.length === 0) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Health Vitals" showBack />
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroLabel}>Last recorded</Text>
            <Text style={styles.heroValue}>
              {vitals[0] ? formatDate(vitals[0].recordedAt) : 'No readings yet'}
            </Text>
          </View>
          <View style={styles.heroPill}>
            <MaterialCommunityIcons name="heart-pulse" size={14} color={Colors.white} />
            <Text style={styles.heroPillText}>{vitals.length} records</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {filterOptions.map((f) => {
            const vt = vitalTypes.find((v) => v.value === f);
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                activeOpacity={0.85}
                style={[
                  styles.filterBtn,
                  isActive && { backgroundColor: vt?.color || Colors.primary, borderColor: vt?.color || Colors.primary },
                ]}
              >
                <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                  {vt?.label || 'All'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FlatList
          data={vitals}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={({ item }) => {
            const vt = vitalTypes.find((v) => v.value === item.type);
            return (
              <AppCard style={styles.card} padded={false}>
                <View style={styles.cardContent}>
                  <View style={[styles.iconBox, { backgroundColor: (vt?.color || Colors.primary) + '15' }]}>
                    <MaterialCommunityIcons
                      name={(vt?.icon || 'heart-outline') as any}
                      size={22}
                      color={vt?.color || Colors.primary}
                    />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.vitalLabel}>{vt?.label || item.type}</Text>
                    <Text style={styles.vitalDate}>{formatDate(item.recordedAt)}</Text>
                  </View>
                  <View style={styles.valueCol}>
                    <Text style={[styles.vitalValue, { color: vt?.color || Colors.primary }]}>
                      {item.value}
                    </Text>
                    <Text style={styles.vitalUnit}>{item.unit}</Text>
                  </View>
                </View>
              </AppCard>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="heart-pulse"
              title="No vitals recorded"
              subtitle="Track your health by recording vitals regularly"
              actionLabel="Add Vital"
              onAction={() => setModalVisible(true)}
            />
          }
        />
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.white}
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Vital Reading</Text>
          <View style={styles.modalTypeWrap}>
            {vitalTypes.map((v) => {
              const active = newType === v.value;
              return (
                <TouchableOpacity
                  key={v.value}
                  onPress={() => setNewType(v.value)}
                  activeOpacity={0.85}
                  style={[
                    styles.modalTypePill,
                    active && { backgroundColor: v.color + '22', borderColor: v.color + '55' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={v.icon as any}
                    size={14}
                    color={active ? v.color : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modalTypeText,
                      active && { color: v.color, fontWeight: Typography.weight.semibold },
                    ]}
                  >
                    {v.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            label={`Value (${selectedVital?.unit || ''})`}
            value={newValue}
            onChangeText={setNewValue}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
            outlineColor={Colors.border}
            activeOutlineColor={selectedVital?.color || Colors.primary}
            textColor={Colors.textPrimary}
            theme={{ roundness: 14 }}
          />
          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setModalVisible(false)}
              textColor={Colors.textSecondary}
              style={styles.modalCancel}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAdd}
              loading={adding}
              style={styles.modalBtn}
              contentStyle={{ paddingVertical: 4 }}
              buttonColor={selectedVital?.color || Colors.primary}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FB' },
  content: { flex: 1 },
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: { color: 'rgba(255,255,255,0.82)', fontSize: Typography.size.sm },
  heroValue: { color: Colors.white, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, marginTop: 2 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  heroPillText: { color: Colors.white, fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  filterRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, maxHeight: 56 },
  filterBtn: {
    marginHorizontal: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  filterLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  filterLabelActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 120, paddingTop: Spacing.xs },
  card: { backgroundColor: Colors.white, borderRadius: 16, marginBottom: Spacing.sm },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  vitalLabel: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  vitalDate: { fontSize: Typography.size.sm, color: Colors.textTertiary, marginTop: 2 },
  valueCol: { alignItems: 'flex-end' },
  vitalValue: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  vitalUnit: { fontSize: Typography.size.xs, color: Colors.textSecondary },
  fab: {
    position: 'absolute', right: 18, bottom: 100,
    backgroundColor: Colors.primary, borderRadius: 18,
  },
  modal: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 8, marginTop: 'auto', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D7DEE8',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  modalTypeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    backgroundColor: Colors.white,
  },
  modalTypeText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  modalInput: { marginBottom: Spacing.md, backgroundColor: '#F8FAFC' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalCancel: {
    borderRadius: 10,
  },
  modalBtn: { borderRadius: 12 },
});
