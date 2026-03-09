import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Card, TextInput, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useGetAppointmentByIdQuery,
  useCreatePrescriptionMutation,
} from '../../../src/store/apiSlice';
import { AppHeader, LoadingScreen } from '../../../src/components';
import { DOSAGE_FREQUENCIES, MEDICINE_DURATIONS } from '../../../src/utils/constants';
import { getDisplayName } from '../../../src/utils/name';
import { Colors } from '../../../src/theme';

interface MedicineEntry {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const emptyMedicine: MedicineEntry = {
  name: '',
  dosage: '',
  frequency: DOSAGE_FREQUENCIES[1],
  duration: MEDICINE_DURATIONS[2],
  instructions: '',
};

export default function PrescriptionWriterScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { data, isLoading } = useGetAppointmentByIdQuery(Number(appointmentId));
  const [createPrescription, { isLoading: creating }] = useCreatePrescriptionMutation();

  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<MedicineEntry[]>([{ ...emptyMedicine }]);
  const [advice, setAdvice] = useState('');

  if (isLoading) return <LoadingScreen />;
  const appointment = data?.data;
  if (!appointment) return <LoadingScreen />;

  const updateMedicine = (index: number, field: keyof MedicineEntry, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const addMedicine = () => setMedicines([...medicines, { ...emptyMedicine }]);

  const removeMedicine = (index: number) => {
    if (medicines.length <= 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Error', 'Please enter a diagnosis');
      return;
    }
    if (medicines.some((m) => !m.name.trim() || !m.dosage.trim())) {
      Alert.alert('Error', 'Please fill in medicine name and dosage');
      return;
    }

    try {
      await createPrescription({
        consultationId: Number(appointmentId),
        patientId: Number(appointment.patientId),
        diagnosis,
        medicines: medicines.map((m) => ({
          name: m.name,
          dose: m.dosage,
          duration: m.duration,
        })),
        advice,
      }).unwrap();

      Alert.alert('Success', 'Prescription created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to create prescription');
    }
  };

  const patientName = getDisplayName(appointment.patient, { fallback: 'Patient' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Write Prescription" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.patientCard}>
          <Card.Content style={styles.patientRow}>
            <MaterialCommunityIcons name="account" size={20} color={Colors.secondary} />
            <Text style={styles.patientName}>Patient: {patientName}</Text>
          </Card.Content>
        </Card>

        <TextInput
          label="Diagnosis"
          value={diagnosis}
          onChangeText={setDiagnosis}
          mode="outlined"
          multiline
          numberOfLines={2}
          style={styles.input}
          outlineColor={Colors.border}
          activeOutlineColor={Colors.secondary}
        />

        <View style={styles.medHeader}>
          <Text style={styles.sectionTitle}>Medicines</Text>
          <Button
            mode="text"
            icon="plus"
            onPress={addMedicine}
            compact
            textColor={Colors.secondary}
          >
            Add
          </Button>
        </View>

        {medicines.map((med, index) => (
          <Card key={index} style={styles.medCard}>
            <Card.Content>
              <View style={styles.medTitleRow}>
                <Text style={styles.medIndex}>#{index + 1}</Text>
                {medicines.length > 1 && (
                  <IconButton
                    icon="close"
                    size={18}
                    iconColor={Colors.error}
                    onPress={() => removeMedicine(index)}
                    style={styles.removeBtn}
                  />
                )}
              </View>
              <TextInput
                label="Medicine Name"
                value={med.name}
                onChangeText={(v) => updateMedicine(index, 'name', v)}
                mode="outlined"
                dense
                style={styles.medInput}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.secondary}
              />
              <TextInput
                label="Dosage (e.g., 500mg)"
                value={med.dosage}
                onChangeText={(v) => updateMedicine(index, 'dosage', v)}
                mode="outlined"
                dense
                style={styles.medInput}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.secondary}
              />
              <View style={styles.medRow}>
                <TextInput
                  label="Frequency"
                  value={med.frequency}
                  onChangeText={(v) => updateMedicine(index, 'frequency', v)}
                  mode="outlined"
                  dense
                  style={[styles.medInput, styles.medHalf]}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.secondary}
                />
                <TextInput
                  label="Duration"
                  value={med.duration}
                  onChangeText={(v) => updateMedicine(index, 'duration', v)}
                  mode="outlined"
                  dense
                  style={[styles.medInput, styles.medHalf]}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.secondary}
                />
              </View>
              <TextInput
                label="Instructions (optional)"
                value={med.instructions}
                onChangeText={(v) => updateMedicine(index, 'instructions', v)}
                mode="outlined"
                dense
                style={styles.medInput}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.secondary}
              />
            </Card.Content>
          </Card>
        ))}

        <TextInput
          label="Advice / Notes"
          value={advice}
          onChangeText={setAdvice}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          outlineColor={Colors.border}
          activeOutlineColor={Colors.secondary}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={creating}
          disabled={creating}
          style={styles.submitBtn}
          contentStyle={styles.submitBtnContent}
          labelStyle={styles.submitBtnLabel}
          buttonColor={Colors.secondary}
          icon="check"
        >
          {creating ? 'Creating...' : 'Create Prescription'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 32 },
  patientCard: { backgroundColor: Colors.secondaryLight + '30', borderRadius: 12, marginBottom: 16 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  patientName: { fontSize: 14, fontWeight: '600', color: Colors.secondary },
  input: { marginBottom: 16, backgroundColor: Colors.white },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  medCard: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 12 },
  medTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  medIndex: { fontSize: 13, fontWeight: '700', color: Colors.secondary },
  removeBtn: { margin: 0 },
  medInput: { marginBottom: 10, backgroundColor: Colors.white },
  medRow: { flexDirection: 'row', gap: 10 },
  medHalf: { flex: 1 },
  submitBtn: { borderRadius: 12, marginTop: 8 },
  submitBtnContent: { paddingVertical: 6 },
  submitBtnLabel: { fontSize: 16, fontWeight: '600' },
});
