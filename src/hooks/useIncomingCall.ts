import { useEffect, useCallback, useRef } from 'react';
import { Vibration, Platform, AppState } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAppSelector, useAppDispatch } from '../store';
import { setIncomingCall, resetVideo } from '../slices/videoSlice';
import { onEvent, offEvent, emitEvent, getSocket } from '../services/socket';
import type { IncomingCall, CallType } from '../types';

const INCOMING_CALL_CHANNEL_ID = 'incoming-calls';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const RING_DURATION = 30_000;

export function useIncomingCall() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { incomingCall, isConnected } = useAppSelector((s) => s.video);
  const isConnectedRef = useRef(isConnected);
  const appStateRef = useRef(AppState.currentState);
  isConnectedRef.current = isConnected;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleIncomingCall = (data: IncomingCall) => {
      // If call state got stuck as connected from a previous session,
      // recover instead of dropping the new incoming call event.
      if (isConnectedRef.current) {
        dispatch(resetVideo());
      }
      dispatch(setIncomingCall({
        appointmentId: data.appointmentId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        callerId: data.callerId,
        callType: (data.callType as CallType) || 'VOICE',
        channelName: data.channelName,
      }));

      // Web fallback: immediately proceed to call screen so incoming calls
      // are not blocked by browser notification/modal limitations.
      if (Platform.OS === 'web') {
        emitEvent('call-accept', {
          callerId: data.callerId,
          appointmentId: data.appointmentId,
        });
        const callType = (data.callType as CallType) || 'VOICE';
        const appointmentId = data.appointmentId;
        const roomId = `appt_${appointmentId}`;
        dispatch(setIncomingCall(null));
        router.push(`/call/${roomId}?callType=${callType}&appointmentId=${appointmentId}`);
        return;
      }

      Vibration.vibrate([0, 500, 300, 500, 300, 500], true);

      // Fire a local notification for incoming call on native.
      // We intentionally avoid strict app-state gating because on some devices
      // app-state transitions can lag and suppress the alert unexpectedly.
      const isVideo = (data.callType as string) === 'VIDEO';
      Notifications.scheduleNotificationAsync({
        content: {
          title: `Incoming ${isVideo ? 'Video' : 'Voice'} Call`,
          body: `${data.callerName || 'Doctor'} is calling you`,
          data: {
            appointmentId: data.appointmentId,
            callType: data.callType,
            channelName: data.channelName,
            callerId: data.callerId,
            callerName: data.callerName,
            callerAvatar: data.callerAvatar,
            appState: appStateRef.current,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 500, 300, 500],
        } as any,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          repeats: false,
          channelId: INCOMING_CALL_CHANNEL_ID,
        },
      }).catch(() => {});
    };

    const handleCallCancelled = () => {
      Vibration.cancel();
      Notifications.dismissAllNotificationsAsync().catch(() => {});
      dispatch(setIncomingCall(null));
    };

    const registerListeners = () => {
      onEvent('incoming-call', handleIncomingCall as (...args: unknown[]) => void);
      onEvent('call-cancelled', handleCallCancelled as (...args: unknown[]) => void);
    };

    registerListeners();

    // Re-register on reconnect AND on socket recreation.
    // useSocketConnection may swap out the socket singleton; poll every 3 s
    // so we always attach to the live socket instance.
    let lastSocket = getSocket();
    const socketPollInterval = setInterval(() => {
      const current = getSocket();
      if (current && current !== lastSocket) {
        // New socket created — re-register listeners on the fresh instance
        lastSocket = current;
        registerListeners();
        current.on('connect', registerListeners);
      }
    }, 3000);

    const socket = getSocket();
    socket?.on('connect', registerListeners);

    return () => {
      clearInterval(socketPollInterval);
      offEvent('incoming-call', handleIncomingCall as (...args: unknown[]) => void);
      offEvent('call-cancelled', handleCallCancelled as (...args: unknown[]) => void);
      socket?.off('connect', registerListeners);
    };
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!incomingCall) return;
    const timeout = setTimeout(() => {
      dismiss();
    }, RING_DURATION);
    return () => clearTimeout(timeout);
  }, [incomingCall]);

  const dismiss = useCallback(() => {
    Vibration.cancel();
    dispatch(setIncomingCall(null));
  }, [dispatch]);

  const accept = useCallback(() => {
    if (!incomingCall) return;
    Vibration.cancel();

    emitEvent('call-accept', {
      callerId: incomingCall.callerId,
      appointmentId: incomingCall.appointmentId,
    });

    const callType = incomingCall.callType || 'VOICE';
    const appointmentId = incomingCall.appointmentId;
    const roomId = `appt_${appointmentId}`;

    dispatch(setIncomingCall(null));
    // Go directly to call screen — no extra "Join" tap needed for incoming calls
    router.push(`/call/${roomId}?callType=${callType}&appointmentId=${appointmentId}`);
  }, [incomingCall, dispatch]);

  const decline = useCallback(() => {
    if (!incomingCall) return;
    Vibration.cancel();

    emitEvent('call-decline', {
      callerId: incomingCall.callerId,
      appointmentId: incomingCall.appointmentId,
    });

    dispatch(setIncomingCall(null));
  }, [incomingCall, dispatch]);

  return { incomingCall, accept, decline, dismiss };
}
