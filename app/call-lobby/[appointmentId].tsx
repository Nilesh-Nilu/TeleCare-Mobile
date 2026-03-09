import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import {
  useGetAppointmentByIdQuery,
  useCreateVideoSessionMutation,
  useGetVideoTokenQuery,
} from '../../src/store/apiSlice';
import { useAppSelector, useAppDispatch } from '../../src/store';
import { setRoom, toggleMute, toggleVideo } from '../../src/slices/videoSlice';
import { Avatar, LoadingScreen } from '../../src/components';
import { getDisplayName } from '../../src/utils/name';
import { Colors } from '../../src/theme';
import type { CallType } from '../../src/types';
import { emitEvent } from '../../src/services/socket';

export default function PreCallLobbyScreen() {
  const { appointmentId, callType: callTypeParam } = useLocalSearchParams<{
    appointmentId: string;
    callType?: string;
  }>();
  const requestedCallType = (callTypeParam as CallType) || 'VOICE';

  const { user } = useAppSelector((s) => s.auth);
  const { isMuted, isVideoOff } = useAppSelector((s) => s.video);
  const dispatch = useAppDispatch();

  const { data: apptData, isLoading: apptLoading } = useGetAppointmentByIdQuery(Number(appointmentId));
  const { data: tokenData } = useGetVideoTokenQuery(Number(appointmentId));
  const [createSession, { isLoading: creating }] = useCreateVideoSessionMutation();
  const callType: CallType = (tokenData?.data?.callType as CallType) || requestedCallType;
  const isVoiceOnly = callType === 'VOICE';

  const [joining, setJoining] = useState(false);
  // Unmount CameraView before navigating so the hardware camera is released
  // before Agora's native engine tries to open it (prevents silent capture failure).
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  useEffect(() => {
    // Always request mic — needed for both voice and video calls
    if (!micPermission?.granted) requestMicPermission();
    if (!isVoiceOnly && !cameraPermission?.granted) requestCameraPermission();
  }, []);

  const appointment = apptData?.data;
  const isDoctor = user?.role === 'doctor';
  const otherPerson = isDoctor ? appointment?.patient : appointment?.doctor;
  const otherName = getDisplayName(otherPerson, {
    doctorPrefix: !isDoctor,
    fallback: 'Participant',
  });

  const handleJoin = async () => {
    // Release the hardware camera immediately so Agora can open it during call setup
    setCameraActive(false);
    setJoining(true);
    // Give React one frame to unmount CameraView and release the camera resource
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
    try {
      if (isDoctor) {
        await createSession({
          appointmentId: Number(appointmentId),
          callType,
        }).unwrap();
      }

      // Notify the other participant via call-initiate — backend resolves the target by appointment
      emitEvent('call-initiate', {
        appointmentId,
        callerName: getDisplayName(user, {
          doctorPrefix: isDoctor,
          fallback: isDoctor ? 'Doctor' : 'Patient',
        }),
        callerAvatar: user?.avatar || null,
        callType,
      });

      const roomId = `appt_${appointmentId}`;
      dispatch(
        setRoom({
          roomId,
          token: tokenData?.data?.token || '',
          appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || '',
          uid: Number(user?.id) || 0,
          callType,
        }),
      );

      router.replace(`/call/${roomId}?callType=${callType}&appointmentId=${appointmentId}`);
    } catch (err) {
      setJoining(false);
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Unable to Join', msg, [{ text: 'OK' }]);
    }
  };

  if (apptLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isVoiceOnly ? 'Voice Call' : 'Video Call'}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.previewArea}>
          {isVoiceOnly ? (
            <View style={styles.voicePreview}>
              <View style={styles.voiceIconCircle}>
                <MaterialCommunityIcons name="phone" size={48} color="#3B82F6" />
              </View>
              <Text style={styles.voiceLabel}>Voice Only</Text>
              <Text style={styles.voiceSub}>Camera will not be used</Text>
            </View>
          ) : (
            <View style={styles.previewPlaceholder}>
              {isVideoOff || !cameraPermission?.granted ? (
                <>
                  <Avatar name={user?.firstName || 'You'} size={80} uri={user?.avatar} />
                  <Text style={styles.previewLabel}>
                    {isVideoOff ? 'Camera Off' : 'Requesting Permission...'}
                  </Text>
                </>
              ) : (
                cameraActive ? (
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="front"
                  />
                ) : null
              )}
            </View>
          )}
        </View>

        <View style={styles.meetingInfo}>
          <Avatar name={otherName} size={48} uri={otherPerson?.avatar} />
          <Text style={styles.otherName}>{otherName}</Text>
          <Text style={styles.waitingText}>
            {isDoctor
              ? 'Start the consultation when ready'
              : 'Waiting for doctor to join...'}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <ControlButton
            icon={isMuted ? 'microphone-off' : 'microphone'}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={!isMuted}
            onPress={() => dispatch(toggleMute())}
          />
          {!isVoiceOnly && (
            <ControlButton
              icon={isVideoOff ? 'video-off' : 'video'}
              label={isVideoOff ? 'Start Video' : 'Stop Video'}
              active={!isVideoOff}
              onPress={() => dispatch(toggleVideo())}
            />
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleJoin}
          loading={joining || creating}
          disabled={joining || creating}
          style={styles.joinBtn}
          contentStyle={styles.joinBtnContent}
          labelStyle={styles.joinBtnLabel}
          icon={isVoiceOnly ? 'phone' : 'video'}
          buttonColor={isVoiceOnly ? '#3B82F6' : Colors.success}
        >
          {joining ? 'Joining...' : (isVoiceOnly ? 'Join Voice Call' : 'Join Video Call')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

function ControlButton({ icon, label, active, onPress }: {
  icon: string; label: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.controlBtn} onPress={onPress}>
      <View style={[styles.controlIcon, !active && styles.controlIconOff]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={Colors.white} />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.white },
  spacer: { width: 40 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  previewArea: { marginBottom: 32 },
  previewPlaceholder: {
    width: 200, height: 200, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  previewLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 12 },
  voicePreview: { alignItems: 'center', gap: 8 },
  voiceIconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(59,130,246,0.3)',
  },
  voiceLabel: { fontSize: 18, fontWeight: '700', color: Colors.white, marginTop: 8 },
  voiceSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  meetingInfo: { alignItems: 'center', marginBottom: 32 },
  otherName: { fontSize: 18, fontWeight: '700', color: Colors.white, marginTop: 12 },
  waitingText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  controlsRow: { flexDirection: 'row', gap: 32 },
  controlBtn: { alignItems: 'center' },
  controlIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  controlIconOff: { backgroundColor: Colors.error },
  controlLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  footer: { padding: 24 },
  joinBtn: { borderRadius: 16 },
  joinBtnContent: { paddingVertical: 8 },
  joinBtnLabel: { fontSize: 16, fontWeight: '700' },
});
