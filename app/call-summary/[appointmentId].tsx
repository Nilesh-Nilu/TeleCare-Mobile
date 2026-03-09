import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppSelector } from '../../src/store';
import { formatDuration } from '../../src/utils/formatters';
import { Colors } from '../../src/theme';

export default function PostCallSummaryScreen() {
  const { appointmentId, duration, callType: callTypeParam } = useLocalSearchParams<{
    appointmentId: string;
    duration: string;
    callType?: string;
  }>();
  const resolvedCallType = callTypeParam || 'VOICE';
  const { user } = useAppSelector((s) => s.auth);
  const isDoctor = user?.role === 'doctor';
  const durationSec = Number(duration) || 0;

  const handleDone = () => {
    router.replace(isDoctor ? '/(doctor)' : '/(patient)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <MaterialCommunityIcons name="check-circle" size={64} color={Colors.success} />
        </View>

        <Text style={styles.title}>Call Ended</Text>
        <Text style={styles.subtitle}>Your consultation has been completed</Text>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <SummaryRow icon="clock-outline" label="Duration" value={formatDuration(durationSec)} />
            <SummaryRow
              icon={resolvedCallType === 'VIDEO' ? 'video-outline' : 'phone-outline'}
              label="Type"
              value={resolvedCallType === 'VIDEO' ? 'Video Call' : 'Voice Call'}
            />
            <SummaryRow icon="check-circle-outline" label="Status" value="Completed" />
          </Card.Content>
        </Card>

        {isDoctor && (
          <Button
            mode="contained"
            icon="file-document-edit-outline"
            onPress={() => router.push(`/(doctor)/prescribe/${appointmentId}`)}
            style={styles.prescribeBtn}
            contentStyle={styles.btnContent}
            buttonColor={Colors.secondary}
          >
            Write Prescription
          </Button>
        )}

        <Button
          mode={isDoctor ? 'outlined' : 'contained'}
          onPress={handleDone}
          style={styles.doneBtn}
          contentStyle={styles.btnContent}
        >
          {isDoctor ? 'Back to Dashboard' : 'Back to Home'}
        </Button>

        {!isDoctor && (
          <Button
            mode="text"
            onPress={() => router.push(`/(patient)/appointments/${appointmentId}`)}
            textColor={Colors.primary}
          >
            View Appointment Details
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ icon, label, value }: {
  icon: string; label: string; value: string;
}) {
  return (
    <View style={summaryStyles.row}>
      <MaterialCommunityIcons name={icon as any} size={20} color={Colors.textSecondary} />
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  label: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  successIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 28 },
  summaryCard: {
    backgroundColor: Colors.white, borderRadius: 16, width: '100%', marginBottom: 28,
  },
  prescribeBtn: { width: '100%', borderRadius: 12, marginBottom: 12 },
  doneBtn: { width: '100%', borderRadius: 12, marginBottom: 12 },
  btnContent: { paddingVertical: 6 },
});
