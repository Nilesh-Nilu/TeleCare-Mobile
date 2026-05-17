import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import {
  useGetDoctorByIdQuery,
  useGetDoctorScheduleQuery,
  useGetBookedSlotsQuery,
} from '../../../src/store/apiSlice';
import { AppHeader, LoadingScreen } from '../../../src/components';
import { getDisplayName } from '../../../src/utils/name';
import { Colors } from '../../../src/theme';

const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

export default function SlotSelectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState(next7Days[0]);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [nowTs, setNowTs] = useState(Date.now());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: doctorData, isLoading: docLoading } = useGetDoctorByIdQuery(Number(id));
  const { data: scheduleData } = useGetDoctorScheduleQuery(Number(id));
  const { data: bookedData } = useGetBookedSlotsQuery({ doctorId: Number(id), date: dateStr });

  const doctor = doctorData?.data;
  const schedule = scheduleData?.data || [];
  const bookedSlots = Array.isArray(bookedData?.data)
    ? bookedData.data
    : Array.isArray(bookedData?.data?.bookedSlots)
      ? bookedData.data.bookedSlots
      : [];

  const daySchedule = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    const normalized = schedule.map((s: any) => ({
      ...s,
      dayOfWeek: Number(s.dayOfWeek),
      isActive: s.isActive !== false,
    }));
    const matched = normalized.find((s: any) => s.dayOfWeek === dayOfWeek && s.isActive);
    // Fallback so slot page stays usable even if schedule config is missing.
    return matched || { startTime: '09:00', endTime: '21:00', slotDuration: 30, isActive: true };
  }, [schedule, selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const slots = useMemo(() => {
    if (!daySchedule) return [];
    const { startTime, endTime, slotDuration = 30 } = daySchedule;
    const result: { start: string; end: string; isBooked: boolean }[] = [];
    const base = dateStr;
    const now = new Date(nowTs);
    const isTodaySelected = isSameDay(selectedDate, now);
    let current = parseISO(`${base}T${startTime}`);
    const endDt = parseISO(`${base}T${endTime}`);

    while (current < endDt) {
      const slotEnd = new Date(current.getTime() + slotDuration * 60000);
      if (slotEnd > endDt) break;

      // Hide slots that have already started for today.
      if (isTodaySelected && current.getTime() <= now.getTime()) {
        current = slotEnd;
        continue;
      }

      const startStr = format(current, 'HH:mm');
      const endStr = format(slotEnd, 'HH:mm');
      const isBooked = bookedSlots.some(
        (b: any) => {
          const raw = b?.startTime || b?.start || '';
          if (!raw) return false;
          if (/^\d{2}:\d{2}$/.test(String(raw))) return String(raw) === startStr;
          const bStart = new Date(raw);
          if (Number.isNaN(bStart.getTime())) return false;
          return format(bStart, 'yyyy-MM-dd') === dateStr && format(bStart, 'HH:mm') === startStr;
        },
      );
      result.push({ start: startStr, end: endStr, isBooked });
      current = slotEnd;
    }
    return result;
  }, [daySchedule, dateStr, bookedSlots, selectedDate, nowTs]);

  useEffect(() => {
    if (!selectedSlot) return;
    const stillAvailable = slots.some(
      (s) => s.start === selectedSlot.start && s.end === selectedSlot.end && !s.isBooked
    );
    if (!stillAvailable) {
      setSelectedSlot(null);
    }
  }, [slots, selectedSlot]);

  if (docLoading) return <LoadingScreen />;

  const fullName = getDisplayName(doctor, { doctorPrefix: true, fallback: 'Doctor' });

  const handleConfirm = () => {
    if (!selectedSlot) return;
    router.push({
      pathname: '/(patient)/booking-confirm',
      params: {
        doctorId: id,
        date: dateStr,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Select Time Slot" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.doctorName}>{fullName}</Text>

        {/* Date picker row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
          {next7Days.map((d) => {
            const isSelected = isSameDay(d, selectedDate);
            return (
              <TouchableOpacity
                key={d.toISOString()}
                style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                onPress={() => { setSelectedDate(d); setSelectedSlot(null); }}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                  {format(d, 'EEE')}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                  {format(d, 'dd')}
                </Text>
                <Text style={[styles.monthLabel, isSelected && styles.monthLabelSelected]}>
                  {format(d, 'MMM')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Slots grid */}
        <Text style={styles.slotsTitle}>
          Available Slots — {format(selectedDate, 'dd MMM, EEEE')}
        </Text>

        {slots.length === 0 ? (
          <View style={styles.noSlots}>
            <MaterialCommunityIcons name="calendar-remove-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.noSlotsText}>No slots available on this day</Text>
          </View>
        ) : (
          <View style={styles.slotsGrid}>
            {slots.map((slot) => {
              const isSelected =
                selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
              return (
                <Chip
                  key={slot.start}
                  selected={isSelected}
                  disabled={slot.isBooked}
                  onPress={() => setSelectedSlot(slot)}
                  style={[
                    styles.slotChip,
                    isSelected && styles.slotChipSelected,
                    slot.isBooked && styles.slotChipBooked,
                  ]}
                  textStyle={[
                    styles.slotText,
                    isSelected && styles.slotTextSelected,
                    slot.isBooked && styles.slotTextBooked,
                  ]}
                  showSelectedOverlay={false}
                >
                  {slot.start}
                </Chip>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={handleConfirm}
          disabled={!selectedSlot}
          style={styles.confirmBtn}
          contentStyle={styles.confirmBtnContent}
          labelStyle={styles.confirmBtnLabel}
        >
          Confirm Slot
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 100 },
  doctorName: {
    fontSize: 16, fontWeight: '600', color: Colors.textPrimary,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  dateRow: { paddingHorizontal: 12, paddingVertical: 8 },
  dateItem: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    marginHorizontal: 4, borderRadius: 12, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border, minWidth: 56,
  },
  dateItemSelected: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },
  dayLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  dayLabelSelected: { color: Colors.white },
  dayNum: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginVertical: 2 },
  dayNumSelected: { color: Colors.white },
  monthLabel: { fontSize: 11, color: Colors.textSecondary },
  monthLabelSelected: { color: 'rgba(255,255,255,0.8)' },
  slotsTitle: {
    fontSize: 15, fontWeight: '600', color: Colors.textPrimary,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12,
  },
  noSlots: {
    alignItems: 'center', paddingVertical: 40,
  },
  noSlotsText: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },
  slotsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8,
  },
  slotChip: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  slotChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotChipBooked: { backgroundColor: Colors.divider, borderColor: Colors.divider },
  slotText: { fontSize: 13, color: Colors.textPrimary },
  slotTextSelected: { color: Colors.white },
  slotTextBooked: { color: Colors.textTertiary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 32, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  confirmBtn: { borderRadius: 12 },
  confirmBtnContent: { paddingVertical: 6 },
  confirmBtnLabel: { fontSize: 16, fontWeight: '600' },
});
