import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Card, Divider, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useGetPrescriptionByIdQuery } from '../../../src/store/apiSlice';
import { AppHeader, Avatar, LoadingScreen } from '../../../src/components';
import { formatDate } from '../../../src/utils/formatters';
import { getDisplayName } from '../../../src/utils/name';
import { Colors } from '../../../src/theme';
import type { Medicine } from '../../../src/types';

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useGetPrescriptionByIdQuery(Number(id));

  if (isLoading) return <LoadingScreen />;
  const rx = data?.data;
  if (!rx) return <LoadingScreen />;

  const docName = getDisplayName(rx.doctor, { doctorPrefix: true, fallback: 'Doctor' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Prescription" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Doctor info */}
        <Card style={styles.card}>
          <Card.Content style={styles.doctorRow}>
            <Avatar name={docName} size={48} uri={rx.doctor?.avatar} />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{docName}</Text>
              <Text style={styles.doctorSpecialty}>{rx.doctor?.specialty}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(rx.createdAt)}</Text>
          </Card.Content>
        </Card>

        {/* Diagnosis */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="stethoscope" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Diagnosis</Text>
            </View>
            <Text style={styles.diagnosisText}>{rx.diagnosis}</Text>
          </Card.Content>
        </Card>

        {/* Medicines */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionRow}>
              <MaterialCommunityIcons name="pill" size={20} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Medicines ({rx.medicines?.length || 0})</Text>
            </View>
            {(rx.medicines || []).map((med: Medicine, idx: number) => (
              <View key={med.id || idx}>
                {idx > 0 && <Divider style={styles.medDivider} />}
                <View style={styles.medItem}>
                  <Text style={styles.medName}>{med.name}</Text>
                  {med.genericName && (
                    <Text style={styles.medGeneric}>{med.genericName}</Text>
                  )}
                  <View style={styles.medChips}>
                    <Chip compact style={styles.medChip} textStyle={styles.medChipText}>
                      {med.dosage}
                    </Chip>
                    <Chip compact style={styles.medChip} textStyle={styles.medChipText}>
                      {med.frequency}
                    </Chip>
                    <Chip compact style={styles.medChip} textStyle={styles.medChipText}>
                      {med.duration}
                    </Chip>
                  </View>
                  {med.instructions && (
                    <Text style={styles.medInstructions}>{med.instructions}</Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Notes */}
        {rx.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionRow}>
                <MaterialCommunityIcons name="note-text-outline" size={20} color={Colors.info} />
                <Text style={styles.sectionTitle}>Notes</Text>
              </View>
              <Text style={styles.notesText}>{rx.notes}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Follow-up */}
        {rx.followUpDate && (
          <Card style={styles.card}>
            <Card.Content style={styles.followUpRow}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.warning} />
              <Text style={styles.followUpLabel}>Follow-up Date: </Text>
              <Text style={styles.followUpDate}>{formatDate(rx.followUpDate)}</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 12 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  doctorSpecialty: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  dateText: { fontSize: 12, color: Colors.textTertiary },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  diagnosisText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  medDivider: { marginVertical: 12 },
  medItem: {},
  medName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  medGeneric: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  medChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  medChip: { backgroundColor: Colors.background },
  medChipText: { fontSize: 11, color: Colors.textSecondary },
  medInstructions: {
    fontSize: 12, color: Colors.textSecondary, marginTop: 6, fontStyle: 'italic',
  },
  notesText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  followUpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  followUpLabel: { fontSize: 14, color: Colors.textSecondary },
  followUpDate: { fontSize: 14, fontWeight: '600', color: Colors.warning },
});
