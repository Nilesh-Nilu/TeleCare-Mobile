import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Button, Card, TextInput, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
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

const readWebFileAsBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      if (!base64) {
        reject(new Error('Unable to read selected file'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Unable to read selected file'));
    reader.readAsDataURL(file);
  });
};

export default function PrescriptionWriterScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { data, isLoading } = useGetAppointmentByIdQuery(Number(appointmentId));
  const [createPrescription, { isLoading: creating }] = useCreatePrescriptionMutation();

  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<MedicineEntry[]>([{ ...emptyMedicine }]);
  const [advice, setAdvice] = useState('');
  const [prescriptionImageBase64, setPrescriptionImageBase64] = useState<string>('');
  const [prescriptionImageName, setPrescriptionImageName] = useState<string>('');
  const [submitMessage, setSubmitMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

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

  const handlePickPrescriptionImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.8,
          base64: false,
        });
        if (result.canceled || result.assets.length === 0) return;
        const file = result.assets[0];
        const webFile = (file as any).file as File | undefined;

        if (webFile) {
          const base64 = await readWebFileAsBase64(webFile);
          setPrescriptionImageBase64(base64);
          setPrescriptionImageName(webFile.name || 'prescription-image.jpg');
          return;
        }

        // Fallback for browsers that only provide a data URI
        if (file.uri?.startsWith('data:') && file.uri.includes(',')) {
          const base64 = file.uri.split(',')[1] || '';
          if (!base64) throw new Error('Invalid image data');
          setPrescriptionImageBase64(base64);
          setPrescriptionImageName('prescription-image.jpg');
          return;
        }

        throw new Error('Web image selection failed');
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo/media access to select an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });
      if (result.canceled || result.assets.length === 0) return;

      const file = result.assets[0];
      if (!file.uri || (file.type && !file.type.includes('image'))) {
        Alert.alert('Error', 'Invalid file selected');
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setPrescriptionImageBase64(base64);
      const inferredName =
        (file as any).fileName ||
        file.uri.split('/').pop() ||
        'prescription-image.jpg';
      setPrescriptionImageName(inferredName);
    } catch {
      Alert.alert('Error', 'Failed to read selected image');
    }
  };

  const handleSubmit = async () => {
    setSubmitMessage(null);
    if (!diagnosis.trim()) {
      setSubmitMessage({ type: 'error', text: 'Please enter a diagnosis.' });
      return;
    }
    if (medicines.some((m) => !m.name.trim() || !m.dosage.trim())) {
      setSubmitMessage({ type: 'error', text: 'Please fill in medicine name and dosage.' });
      return;
    }
    const consultationId = Number((appointment as any)?.consultationId);
    const resolvedAppointmentId = Number(appointmentId || (appointment as any)?.id);
    if (!resolvedAppointmentId || Number.isNaN(resolvedAppointmentId)) {
      setSubmitMessage({ type: 'error', text: 'Invalid appointment.' });
      return;
    }

    try {
      await createPrescription({
        ...(consultationId && !Number.isNaN(consultationId) ? { consultationId } : {}),
        appointmentId: resolvedAppointmentId,
        doctorId: Number(appointment.doctorId),
        patientId: Number(appointment.patientId),
        diagnosis,
        medicines: medicines.map((m) => ({
          name: m.name,
          dose: m.dosage,
          duration: m.duration,
        })),
        advice,
        ...(prescriptionImageBase64 ? { imageBase64: prescriptionImageBase64 } : {}),
      }).unwrap();

      setSubmitMessage({ type: 'success', text: 'Prescription created successfully.' });
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Prescription created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        setTimeout(() => router.back(), 700);
      }
    } catch (err) {
      const apiErr = err as { data?: { message?: string }; error?: string; status?: number | string };
      setSubmitMessage({
        type: 'error',
        text:
          apiErr?.data?.message ||
          apiErr?.error ||
          (apiErr?.status ? `Failed to create prescription (${apiErr.status})` : '') ||
          'Failed to create prescription',
      });
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

        <Card style={styles.uploadCard}>
          <Card.Content>
            <Text style={styles.uploadTitle}>Upload Prescription Image (Optional)</Text>
            <Button
              mode="outlined"
              icon="image-outline"
              onPress={handlePickPrescriptionImage}
              style={styles.uploadBtn}
            >
              {prescriptionImageName ? 'Change Image' : 'Select Image'}
            </Button>
            {prescriptionImageName ? (
              <Text style={styles.uploadFileName}>{prescriptionImageName}</Text>
            ) : null}
          </Card.Content>
        </Card>

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
        {submitMessage ? (
          <Text
            style={[
              styles.submitMessage,
              submitMessage.type === 'error' ? styles.submitMessageError : styles.submitMessageSuccess,
            ]}
          >
            {submitMessage.text}
          </Text>
        ) : null}
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
  uploadCard: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 12 },
  uploadTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  uploadBtn: { borderRadius: 10, alignSelf: 'flex-start' },
  uploadFileName: { marginTop: 8, color: Colors.textSecondary, fontSize: 12 },
  submitBtn: { borderRadius: 12, marginTop: 8 },
  submitBtnContent: { paddingVertical: 6 },
  submitBtnLabel: { fontSize: 16, fontWeight: '600' },
  submitMessage: { marginTop: 10, fontSize: 14, fontWeight: '600' },
  submitMessageError: { color: Colors.error },
  submitMessageSuccess: { color: Colors.success || '#16a34a' },
});
