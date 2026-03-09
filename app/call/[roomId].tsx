import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useAppSelector, useAppDispatch } from '../../src/store';
import { useGetAppointmentByIdQuery, useGetVideoTokenQuery } from '../../src/store/apiSlice';
import {
  toggleMute,
  toggleVideo,
  toggleSpeaker,
  setCallDuration,
  resetVideo,
} from '../../src/slices/videoSlice';
import { useStreamCall } from '../../src/hooks/useStreamCall';
import { Avatar } from '../../src/components';
import { formatDuration } from '../../src/utils/formatters';
import { getDisplayName } from '../../src/utils/name';
import { Colors } from '../../src/theme';
import type { CallType } from '../../src/types';
import { emitEvent, onEvent, offEvent } from '../../src/services/socket';

export default function VideoCallScreen() {
  const { roomId, callType: callTypeParam, appointmentId } = useLocalSearchParams<{
    roomId: string;
    callType?: string;
    appointmentId?: string;
  }>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const {
    isMuted, isVideoOff, isSpeakerOn, callDuration, callType: storeCallType,
  } = useAppSelector((s) => s.video);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const joinedAfterPermissionsRef = useRef(false);
  const endedRef = useRef(false);
  const appointmentIdNum = appointmentId ? Number(appointmentId) : NaN;
  const { data: tokenData } = useGetVideoTokenQuery(appointmentIdNum, {
    skip: !appointmentId || Number.isNaN(appointmentIdNum),
  });
  const { data: apptData } = useGetAppointmentByIdQuery(appointmentIdNum, {
    skip: !appointmentId || Number.isNaN(appointmentIdNum),
  });

  const callType: CallType =
    (tokenData?.data?.callType as CallType)
    || (callTypeParam as CallType)
    || storeCallType
    || 'VOICE';
  const isVoiceOnly = callType === 'VOICE';

  const {
    isReady, participants, remoteVideoTrack, remoteUid, joinCall,
    localUid, videoSourceType, audioPlaybackFailed, localVideoTrackRef, resumeAudio,
  } = useStreamCall({
    callId: roomId!,
    appointmentId: appointmentId || roomId!,
    callType,
    autoJoin: false,
  });

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  // Agora Web SDK renders video by appending a child <div> into a container element.
  // Using a <video> element here breaks rendering — it must be a <div>.
  const webRemoteVideoRef = useRef<any>(null);
  const webLocalVideoRef = useRef<any>(null);
  const WebDivTag: any = 'div';
  const AgoraNative = Platform.OS === 'web' ? null : require('react-native-agora');
  const RtcSurfaceView = AgoraNative?.RtcSurfaceView;
  const RtcTextureView = AgoraNative?.RtcTextureView;
  const RenderModeType = AgoraNative?.RenderModeType;

  const isDoctor = user?.role === 'doctor';
  const fullName = getDisplayName(user, { fallback: 'You' });
  const otherName = isDoctor ? 'Patient' : 'Doctor';

  useEffect(() => {
    // Mic is always needed for audio in both voice and video calls
    if (!micPermission?.granted) requestMicPermission();
    if (!isVoiceOnly && !cameraPermission?.granted) requestCameraPermission();
  }, [isVoiceOnly, micPermission?.granted, cameraPermission?.granted]);

  useEffect(() => {
    if (joinedAfterPermissionsRef.current) return;
    if (!micPermission?.granted) return;
    if (!isVoiceOnly && !cameraPermission?.granted) return;
    joinedAfterPermissionsRef.current = true;
    joinCall();
  }, [joinCall, isVoiceOnly, micPermission?.granted, cameraPermission?.granted]);

  useEffect(() => {
    durationRef.current = 0;
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      dispatch(setCallDuration(durationRef.current));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dispatch]);

  const finishCall = useCallback((notifyPeer: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;

    if (notifyPeer && appointmentId) {
      emitEvent('call-ended', { appointmentId });
    }

    if (timerRef.current) clearInterval(timerRef.current);
    const duration = callDuration;
    dispatch(resetVideo());
    router.replace({
      pathname: '/call-summary/[appointmentId]',
      params: { appointmentId: appointmentId || roomId!, duration: String(duration), callType },
    });
  }, [roomId, appointmentId, callDuration, callType, dispatch]);

  const handleEndCall = useCallback(() => {
    if (Platform.OS === 'web') {
      if (window.confirm('End this call?')) finishCall(true);
    } else {
      Alert.alert('End Call', 'Are you sure you want to end this call?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End', style: 'destructive', onPress: () => finishCall(true) },
      ]);
    }
  }, [finishCall]);

  useEffect(() => {
    const handlePeerEnded = (data: { appointmentId?: string; endedBy?: string }) => {
      if (!appointmentId) return;
      if (String(data?.appointmentId) !== String(appointmentId)) return;
      if (String(data?.endedBy || '') === String(user?.id || '')) return;
      finishCall(false);
    };
    onEvent('call-ended', handlePeerEnded as (...args: unknown[]) => void);
    return () => {
      offEvent('call-ended', handlePeerEnded as (...args: unknown[]) => void);
    };
  }, [appointmentId, user?.id, finishCall]);

  // Play remote video track into the <div> container (Agora appends its own <video> inside)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const container = webRemoteVideoRef.current;
    if (!container || !remoteVideoTrack) return;
    try {
      remoteVideoTrack.play(container);
    } catch (e) {
      console.warn('[AgoraWeb] remoteVideoTrack.play error:', e);
    }
    return () => {
      try { remoteVideoTrack.stop?.(); } catch { /* ignore */ }
    };
  }, [remoteVideoTrack]);

  // Play local video track preview into the PIP <div> container on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const container = webLocalVideoRef.current;
    if (!container || !isReady) return;
    const track = localVideoTrackRef?.current;
    if (!track) return;
    try {
      track.play(container);
    } catch (e) {
      console.warn('[AgoraWeb] localVideoTrack.play error:', e);
    }
  }, [isReady, localVideoTrackRef]);

  const handleFlipCamera = () => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  if (isVoiceOnly) {
    return (
      <View style={styles.container}>
        <View style={styles.voiceCallBody}>
          <View style={styles.voiceAvatarRing}>
            <View style={styles.voiceAvatarInner}>
              <Avatar name={otherName} size={100} />
            </View>
          </View>
          <Text style={styles.voiceCallerName}>{otherName}</Text>
          <Text style={styles.voiceCallerRole}>
            {isDoctor ? 'Patient' : 'Doctor'}
          </Text>

          <View style={styles.voiceTimerRow}>
            <View style={styles.liveIndicator} />
            <Text style={styles.voiceTimer}>{formatDuration(callDuration)}</Text>
          </View>

          <View style={styles.voiceWaveContainer}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.voiceWaveBar,
                  { height: 16 + Math.random() * 24, opacity: isMuted ? 0.2 : 0.6 + Math.random() * 0.4 },
                ]}
              />
            ))}
          </View>
        </View>

        <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
          <View style={styles.controls}>
            <CallButton
              icon={isMuted ? 'microphone-off' : 'microphone'}
              label={isMuted ? 'Unmute' : 'Mute'}
              active={!isMuted}
              onPress={() => dispatch(toggleMute())}
            />
            <CallButton
              icon={isSpeakerOn ? 'volume-high' : 'volume-off'}
              label={isSpeakerOn ? 'Speaker' : 'Earpiece'}
              active={isSpeakerOn}
              onPress={() => dispatch(toggleSpeaker())}
            />
            <CallButton
              icon="phone-hangup"
              label="End"
              active={false}
              isEnd
              onPress={handleEndCall}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.remoteView}>
        {Platform.OS === 'web' && remoteVideoTrack ? (
          <View style={StyleSheet.absoluteFill}>
            {/* Agora appends its own <video> inside this div — do NOT use a <video> element here */}
            <WebDivTag
              ref={webRemoteVideoRef}
              style={{ width: '100%', height: '100%', backgroundColor: '#000', overflow: 'hidden' }}
            />
          </View>
        ) : Platform.OS !== 'web' && remoteUid && RtcSurfaceView ? (
          <RtcSurfaceView
            style={StyleSheet.absoluteFill}
            canvas={{
              uid: remoteUid,
              renderMode: RenderModeType?.RenderModeHidden ?? 1,
            }}
          />
        ) : (
          <View style={styles.remotePlaceholder}>
            <Avatar name={otherName} size={100} />
            <Text style={styles.connectingText}>
              Waiting for participant video...
            </Text>
          </View>
        )}
      </View>

      <View style={styles.localView}>
        {Platform.OS === 'web' && !isVoiceOnly && !isVideoOff && isReady ? (
          <WebDivTag
            ref={webLocalVideoRef}
            style={{ width: '100%', height: '100%', backgroundColor: '#000', overflow: 'hidden' }}
          />
        ) : Platform.OS === 'android' && !isVoiceOnly && !isVideoOff && RtcTextureView ? (
          <RtcTextureView
            key={`local-${String(localUid || 0)}-${String(isReady)}`}
            style={StyleSheet.absoluteFill}
            canvas={{
              uid: localUid || 0,
              renderMode: RenderModeType?.RenderModeHidden ?? 1,
              sourceType: videoSourceType?.VideoSourceCameraPrimary ?? 0,
            }}
          />
        ) : Platform.OS !== 'web' && !isVoiceOnly && !isVideoOff && RtcSurfaceView ? (
          <RtcSurfaceView
            style={StyleSheet.absoluteFill}
            zOrderMediaOverlay
            canvas={{
              uid: 0,
              renderMode: RenderModeType?.RenderModeHidden ?? 1,
            }}
          />
        ) : (
          <View style={styles.pipContent}>
            <Avatar name={fullName} size={40} uri={user?.avatar} />
            <Text style={styles.pipLabel}>You</Text>
          </View>
        )}
      </View>

      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.topBarContent}>
          <View style={styles.callInfo}>
            <View style={styles.liveIndicator} />
            <Text style={styles.timerText}>{formatDuration(callDuration)}</Text>
          </View>
          <View style={styles.topRight}>
            <TouchableOpacity style={styles.flipBtn} onPress={handleFlipCamera}>
              <MaterialCommunityIcons name="camera-flip-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.callerInfo}>
        <Text style={styles.callerName}>{otherName}</Text>
        <Text style={styles.callerRole}>
          {isDoctor ? 'Patient' : 'Doctor'}
        </Text>
      </View>

      {/* Audio autoplay unlock banner — shown when Chrome blocks audio until user taps */}
      {Platform.OS === 'web' && audioPlaybackFailed && (
        <TouchableOpacity style={styles.audioUnlockBanner} onPress={resumeAudio}>
          <MaterialCommunityIcons name="volume-off" size={20} color={Colors.white} />
          <Text style={styles.audioUnlockText}>Tap to enable audio</Text>
        </TouchableOpacity>
      )}

      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <View style={styles.controls}>
          <CallButton
            icon={isMuted ? 'microphone-off' : 'microphone'}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={!isMuted}
            onPress={() => dispatch(toggleMute())}
          />
          <CallButton
            icon={isVideoOff ? 'video-off' : 'video'}
            label={isVideoOff ? 'Camera On' : 'Camera Off'}
            active={!isVideoOff}
            onPress={() => dispatch(toggleVideo())}
          />
          <CallButton
            icon={isSpeakerOn ? 'volume-high' : 'volume-off'}
            label={isSpeakerOn ? 'Speaker' : 'Earpiece'}
            active={isSpeakerOn}
            onPress={() => dispatch(toggleSpeaker())}
          />
          <CallButton
            icon="phone-hangup"
            label="End"
            active={false}
            isEnd
            onPress={handleEndCall}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function CallButton({ icon, label, active, isEnd, onPress }: {
  icon: string; label: string; active: boolean; isEnd?: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.callBtn} onPress={onPress}>
      <View
        style={[
          styles.callBtnIcon,
          isEnd ? styles.callBtnEnd : (!active ? styles.callBtnOff : {}),
        ]}
      >
        <MaterialCommunityIcons name={icon as any} size={24} color={Colors.white} />
      </View>
      <Text style={styles.callBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },

  // Voice call styles
  voiceCallBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  voiceAvatarRing: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 3, borderColor: 'rgba(59,130,246,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  voiceAvatarInner: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  voiceCallerName: { fontSize: 24, fontWeight: '700', color: Colors.white, marginTop: 20 },
  voiceCallerRole: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  voiceTimerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  voiceTimer: { fontSize: 20, fontWeight: '600', color: Colors.white },
  voiceWaveContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 24,
  },
  voiceWaveBar: {
    width: 4, borderRadius: 2, backgroundColor: '#3B82F6',
  },

  // Video call styles
  remoteView: { flex: 1 },
  remotePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  connectingText: { color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: 14 },
  localView: {
    position: 'absolute', top: 100, right: 16,
    width: 100, height: 130, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  pipContent: { alignItems: 'center', gap: 4 },
  pipLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBarContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  callInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  timerText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  topRight: { flexDirection: 'row', gap: 12 },
  flipBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  callerInfo: {
    position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center',
  },
  callerName: { fontSize: 20, fontWeight: '700', color: Colors.white },
  callerRole: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Shared controls
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  controls: {
    flexDirection: 'row', justifyContent: 'center', gap: 20,
    paddingVertical: 16, paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  callBtn: { alignItems: 'center' },
  callBtnIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  callBtnOff: { backgroundColor: 'rgba(255,255,255,0.3)' },
  callBtnEnd: { backgroundColor: Colors.error },
  callBtnLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  audioUnlockBanner: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  audioUnlockText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
});
