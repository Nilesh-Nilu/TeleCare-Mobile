import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { setConnecting, setConnected, addRemoteUid } from '../slices/videoSlice';
import api from '../services/api';
import type { CallType } from '../types';

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

let AgoraRTC: any = null;
let createAgoraRtcEngine: any = null;
let RtcEngineContextClass: any = null;
let ChannelProfileType: any = null;
let ClientRoleType: any = null;
let VideoSourceType: any = null;

// Native SDK can be required at module level (Metro stubs it on web)
if (Platform.OS !== 'web') {
  try {
    const AgoraNative = require('react-native-agora');
    createAgoraRtcEngine = AgoraNative.createAgoraRtcEngine;
    RtcEngineContextClass = AgoraNative.RtcEngineContext;
    ChannelProfileType = AgoraNative.ChannelProfileType;
    ClientRoleType = AgoraNative.ClientRoleType;
    VideoSourceType = AgoraNative.VideoSourceType;
  } catch {
    console.warn('[useStreamCall] react-native-agora not available');
  }
}

// Web SDK is loaded lazily inside joinCall to avoid Metro bundler issues
// with top-level browser globals (window, RTCPeerConnection, etc.)
const loadAgoraWeb = async (): Promise<any> => {
  if (AgoraRTC) return AgoraRTC;
  try {
    const mod = await import('agora-rtc-sdk-ng');
    AgoraRTC = (mod as any).default || mod;
    return AgoraRTC;
  } catch (e) {
    console.warn('[useStreamCall] agora-rtc-sdk-ng failed to load:', e);
    return null;
  }
};

interface UseStreamCallOptions {
  callId: string;
  appointmentId?: string;
  callType?: CallType;
  autoJoin?: boolean;
}

interface TokenResponse {
  token: string;
  apiKey?: string;
  appId?: string;
  callType?: CallType;
  channelName?: string;
  uid?: number | string;
}

export function useStreamCall({ callId, appointmentId, callType = 'VOICE', autoJoin = false }: UseStreamCallOptions) {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const { isMuted, isVideoOff, isSpeakerOn } = useAppSelector((s) => s.video);

  const webClientRef = useRef<any>(null);
  const nativeEngineRef = useRef<any>(null);
  const nativeHandlerRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);
  const joinedRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [call, setCall] = useState<any>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [remoteVideoStreamUrl, setRemoteVideoStreamUrl] = useState<string | null>(null);
  const [remoteSessionId, setRemoteSessionId] = useState<string | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [localUid, setLocalUid] = useState<number | null>(null);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);

  const ensureNativePermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (callType !== 'VOICE') {
      permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    }

    const result = await PermissionsAndroid.requestMultiple(permissions);
    const denied = permissions.filter((p) => result[p] !== PermissionsAndroid.RESULTS.GRANTED);
    if (denied.length > 0) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is required to join calls.' +
          (callType !== 'VOICE' ? ' Camera permission is also required for video calls.' : '')
      );
      return false;
    }
    return true;
  }, [callType]);

  const fetchToken = useCallback(async (): Promise<TokenResponse | null> => {
    const tokenId = appointmentId || callId;
    try {
      const res = await api.get(`/video/token/${tokenId}`);
      return {
        token: res.data.data?.token || res.data.token,
        apiKey: res.data.data?.apiKey || res.data.apiKey,
        appId: res.data.data?.appId || res.data.appId,
        callType: res.data.data?.callType || res.data.callType,
        channelName: res.data.data?.channelName || res.data.channelName,
        uid: res.data.data?.uid || res.data.uid,
      };
    } catch (err) {
      console.error('[AgoraCall] Failed to fetch token:', err);
      return null;
    }
  }, [callId, appointmentId]);

  const leaveCall = useCallback(async () => {
    joinedRef.current = false;
    setIsReady(false);

    if (Platform.OS === 'web') {
      const webClient = webClientRef.current;
      const audioTrack = localAudioTrackRef.current;
      const videoTrack = localVideoTrackRef.current;

      if (webClient) {
        try {
          const tracks = [audioTrack, videoTrack].filter(Boolean);
          if (tracks.length) await webClient.unpublish(tracks);
        } catch { /* ignore */ }
      }

      try { audioTrack?.stop?.(); } catch { /* ignore */ }
      try { audioTrack?.close?.(); } catch { /* ignore */ }
      try { videoTrack?.stop?.(); } catch { /* ignore */ }
      try { videoTrack?.close?.(); } catch { /* ignore */ }

      localAudioTrackRef.current = null;
      localVideoTrackRef.current = null;

      if (webClient) {
        try { await webClient.leave(); } catch { /* ignore */ }
      }
      webClientRef.current = null;
    } else {
      const engine = nativeEngineRef.current;
      if (engine) {
        try {
          if (nativeHandlerRef.current) {
            engine.unregisterEventHandler(nativeHandlerRef.current);
          }
        } catch { /* ignore */ }
        try { engine.leaveChannel(); } catch { /* ignore */ }
        try { engine.release(); } catch { /* ignore */ }
      }
      nativeEngineRef.current = null;
      nativeHandlerRef.current = null;
    }

    setClient(null);
    setCall(null);
    setParticipants([]);
    setRemoteVideoTrack(null);
    setRemoteUid(null);
    setLocalUid(null);
    setRemoteSessionId(null);
    setRemoteVideoStreamUrl(null);
    dispatch(setConnected(false));
  }, [dispatch]);

  const joinCall = useCallback(async () => {
    if (joinedRef.current) return;
    dispatch(setConnecting(true));

    try {
      const tokenData = await fetchToken();
      if (!tokenData?.token) {
        dispatch(setConnecting(false));
        return;
      }

      const appId = tokenData.appId || tokenData.apiKey || AGORA_APP_ID;
      const channelName = tokenData.channelName || callId;
      const userUid = Number(tokenData.uid || authUser?.id || 0);

      if (!appId) {
        console.error('[AgoraCall] Missing Agora appId');
        dispatch(setConnecting(false));
        return;
      }

      if (Platform.OS === 'web') {
        const AgoraRTCWeb = await loadAgoraWeb();
        if (!AgoraRTCWeb) {
          dispatch(setConnecting(false));
          return;
        }
        AgoraRTC = AgoraRTCWeb;

        const webClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
        webClientRef.current = webClient;

        // Notify UI when browser blocks audio autoplay so it can show a "tap to unmute" prompt
        AgoraRTC.onAudioAutoplayFailed = () => {
          console.warn('[AgoraWeb] Audio autoplay blocked — waiting for user gesture');
          setAudioPlaybackFailed(true);
        };

        webClient.on('user-published', async (user: any, mediaType: 'audio' | 'video') => {
          console.log('[AgoraWeb] user-published', { uid: user?.uid, mediaType });
          try {
            await webClient.subscribe(user, mediaType);
          } catch (e) {
            console.error('[AgoraWeb] subscribe failed:', e);
            return;
          }
          if (mediaType === 'audio') {
            try {
              user.audioTrack?.play?.();
              setAudioPlaybackFailed(false);
            } catch (e) {
              console.warn('[AgoraWeb] audio play failed:', e);
              setAudioPlaybackFailed(true);
            }
          }
          if (mediaType === 'video') {
            setRemoteVideoTrack(user.videoTrack || null);
            setRemoteSessionId(String(user.uid));
            const uid = Number(user.uid);
            setRemoteUid(Number.isNaN(uid) ? null : uid);
            if (!Number.isNaN(uid)) dispatch(addRemoteUid(String(uid)));
          }
          setParticipants(webClient.remoteUsers.map((u: any) => String(u.uid)));
        });
        webClient.on('user-joined', (user: any) => {
          console.log('[AgoraWeb] user-joined', {
            uid: user?.uid,
            hasAudio: user?.hasAudio,
            hasVideo: user?.hasVideo,
          });
        });
        webClient.on('user-info-updated', (uid: string | number, msg: string) => {
          console.log('[AgoraWeb] user-info-updated', { uid, msg });
        });

        webClient.on('user-unpublished', (user: any, mediaType: 'audio' | 'video') => {
          if (mediaType === 'video') {
            const uid = String(user.uid);
            if (remoteSessionId === uid) {
              setRemoteVideoTrack(null);
              setRemoteSessionId(null);
              setRemoteUid(null);
            }
          }
          setParticipants(webClient.remoteUsers.map((u: any) => String(u.uid)));
        });

        webClient.on('user-left', (user: any) => {
          const uid = String(user.uid);
          if (remoteSessionId === uid) {
            setRemoteVideoTrack(null);
            setRemoteSessionId(null);
            setRemoteUid(null);
          }
          setParticipants(webClient.remoteUsers.map((u: any) => String(u.uid)));
        });

        await webClient.join(appId, channelName, tokenData.token, userUid || null);

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;
        await audioTrack.setEnabled(!isMuted);

        const publishTracks: any[] = [audioTrack];
        if (callType !== 'VOICE') {
          const videoTrack = await AgoraRTC.createCameraVideoTrack();
          localVideoTrackRef.current = videoTrack;
          await videoTrack.setEnabled(!isVideoOff);
          publishTracks.push(videoTrack);
        }

        await webClient.publish(publishTracks);

        joinedRef.current = true;
        setClient(webClient);
        setCall(webClient);
        setIsReady(true);
        dispatch(setConnected(true));
        return;
      }

      if (!createAgoraRtcEngine) {
        dispatch(setConnecting(false));
        return;
      }

      const hasPermissions = await ensureNativePermissions();
      if (!hasPermissions) {
        dispatch(setConnecting(false));
        return;
      }

      const engine = createAgoraRtcEngine();
      nativeEngineRef.current = engine;
      const nativeStep = (label: string, fn: () => void) => {
        try {
          fn();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          throw new Error(`[AgoraNative:${label}] ${msg}`);
        }
      };
      nativeStep('initialize', () => {
        if (RtcEngineContextClass) {
          const context = new RtcEngineContextClass();
          context.appId = appId;
          engine.initialize(context);
          return;
        }
        engine.initialize({ appId });
      });
      nativeStep('setChannelProfile', () => {
        engine.setChannelProfile?.(ChannelProfileType?.ChannelProfileCommunication ?? 0);
      });
      nativeStep('setClientRole', () => {
        engine.setClientRole?.(ClientRoleType?.ClientRoleBroadcaster ?? 1);
      });
      nativeStep('enableAudio', () => engine.enableAudio());
      nativeStep('enableVideo', () => engine.enableVideo());
      nativeStep('enableLocalAudio', () => engine.enableLocalAudio?.(true));
      nativeStep('enableLocalVideo', () => engine.enableLocalVideo?.(callType !== 'VOICE'));
      nativeStep('setSpeaker', () => engine.setEnableSpeakerphone(Boolean(isSpeakerOn)));
      nativeStep('muteLocalAudio', () => engine.muteLocalAudioStream(Boolean(isMuted)));
      nativeStep('muteLocalVideo', () => engine.muteLocalVideoStream(callType === 'VOICE' || Boolean(isVideoOff)));

      const handler = {
        onJoinChannelSuccess: (_connection: any, uid: number) => {
          console.log('[AgoraNative] join success', { uid });
          setLocalUid(uid);
          setParticipants((prev) => Array.from(new Set([...prev, String(uid)])));
        },
        onUserJoined: (_connection: any, uid: number) => {
          console.log('[AgoraNative] remote user joined', { uid });
          setRemoteUid(uid);
          setRemoteSessionId(String(uid));
          setRemoteVideoStreamUrl(`agora://${uid}`);
          setParticipants((prev) => Array.from(new Set([...prev, String(uid)])));
          dispatch(addRemoteUid(String(uid)));
        },
        onUserOffline: (_connection: any, uid: number) => {
          console.log('[AgoraNative] remote user offline', { uid });
          setParticipants((prev) => prev.filter((id) => id !== String(uid)));
          setRemoteUid((prev) => (prev === uid ? null : prev));
          setRemoteSessionId((prev) => (prev === String(uid) ? null : prev));
          setRemoteVideoStreamUrl((prev) => (prev === `agora://${uid}` ? null : prev));
        },
        onLocalAudioStateChanged: (state: number, error: number) => {
          console.log('[AgoraNative] local audio state', { state, error });
        },
        onLocalVideoStateChanged: (_source: number, state: number, error: number) => {
          console.log('[AgoraNative] local video state', { state, error });
        },
        onError: (error: number, message: string) => {
          console.error('[AgoraNative] error', { error, message });
        },
      };
      nativeHandlerRef.current = handler;
      nativeStep('registerEventHandler', () => engine.registerEventHandler(handler));
      nativeStep('joinChannel', () => engine.joinChannel(tokenData.token, channelName, userUid || 0, {
        publishCameraTrack: callType !== 'VOICE',
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      } as any));
      if (callType !== 'VOICE') {
        nativeStep('startPreview', () => engine.startPreview?.());
      }

      // Re-assert publish options after a short delay in case the camera was still
      // held by another component (e.g. expo-camera lobby preview) at join time.
      if (callType !== 'VOICE') {
        setTimeout(() => {
          try {
            engine.updateChannelMediaOptions?.({
              publishCameraTrack: true,
              publishMicrophoneTrack: true,
            });
            engine.startPreview?.();
          } catch { /* ignore */ }
        }, 500);
      }

      joinedRef.current = true;
      setClient(engine);
      setCall(engine);
      setIsReady(true);
      dispatch(setConnected(true));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AgoraCall] Join error:', err);
      dispatch(setConnecting(false));
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Call Connection Failed',
          `Could not join the call.\n\n${msg}`,
          [{ text: 'OK' }],
        );
      }
    }
  }, [authUser?.id, callId, callType, dispatch, fetchToken, isMuted, isSpeakerOn, isVideoOff]);

  useEffect(() => {
    if (!joinedRef.current) return;
    if (Platform.OS === 'web') {
      localAudioTrackRef.current?.setEnabled?.(!isMuted).catch?.(() => {});
      return;
    }
    nativeEngineRef.current?.muteLocalAudioStream?.(Boolean(isMuted));
  }, [isMuted]);

  useEffect(() => {
    if (!joinedRef.current) return;
    if (Platform.OS === 'web') return;
    nativeEngineRef.current?.setEnableSpeakerphone?.(Boolean(isSpeakerOn));
  }, [isSpeakerOn]);

  useEffect(() => {
    if (!joinedRef.current) return;
    if (Platform.OS === 'web') {
      if (!localVideoTrackRef.current) return;
      localVideoTrackRef.current.setEnabled?.(callType !== 'VOICE' && !isVideoOff).catch?.(() => {});
      return;
    }
    nativeEngineRef.current?.muteLocalVideoStream?.(callType === 'VOICE' || Boolean(isVideoOff));
  }, [isVideoOff, callType]);

  useEffect(() => {
    if (autoJoin && callId) {
      joinCall();
    }
    return () => {
      leaveCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumeAudio = useCallback(() => {
    if (Platform.OS !== 'web') return;
    setAudioPlaybackFailed(false);
    webClientRef.current?.remoteUsers?.forEach((u: any) => {
      try { u.audioTrack?.play?.(); } catch { /* ignore */ }
    });
  }, []);

  return {
    client,
    call,
    isReady,
    participants,
    remoteVideoStreamUrl,
    remoteSessionId,
    remoteVideoTrack,
    remoteUid,
    localUid,
    videoSourceType: VideoSourceType,
    audioPlaybackFailed,
    localVideoTrackRef,
    joinCall,
    leaveCall,
    resumeAudio,
  };
}
