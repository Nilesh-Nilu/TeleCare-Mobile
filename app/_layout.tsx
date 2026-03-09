import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { store, useAppDispatch } from '../src/store';
import { hydrateAuth, logout } from '../src/slices/authSlice';
import { setIncomingCall } from '../src/slices/videoSlice';
import { setAccessToken, setOnAuthFailure } from '../src/services/api';
import { useSocketConnection } from '../src/hooks/useSocketConnection';
import { IncomingCallOverlay } from '../src/components';
import { paperTheme } from '../src/theme';
import type { User, AuthTokens, CallType } from '../src/types';

const INCOMING_CALL_CHANNEL_ID = 'incoming-calls';

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [userStr, accessToken, refreshToken, onboarded] = await AsyncStorage.multiGet([
          'user', 'accessToken', 'refreshToken', 'onboarded',
        ]);
        const user: User | null = userStr[1] ? JSON.parse(userStr[1]) : null;
        const tokens: AuthTokens | null = accessToken[1]
          ? { accessToken: accessToken[1], refreshToken: refreshToken[1] || '', expiresIn: 900 }
          : null;
        if (tokens?.accessToken) setAccessToken(tokens.accessToken);
        dispatch(hydrateAuth({ user, tokens, onboarded: onboarded[1] === 'true' }));
        setOnAuthFailure(() => {
          dispatch(logout());
          router.replace('/(auth)/login');
        });
      } catch {
        dispatch(hydrateAuth({ user: null, tokens: null, onboarded: false }));
      } finally {
        setReady(true);
      }
    })();
  }, [dispatch]);

  useSocketConnection();

  // Request notification permissions once
  useEffect(() => {
    (async () => {
      try {
        await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync(INCOMING_CALL_CHANNEL_ID, {
            name: 'Incoming Calls',
            importance: Notifications.AndroidImportance.MAX,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            vibrationPattern: [0, 500, 300, 500],
            lightColor: '#2563EB',
            sound: 'default',
          });
        }
      } catch {
        // no-op
      }
    })();
  }, []);

  // Handle tap on incoming call notification (app backgrounded)
  useEffect(() => {
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as any;
      if (data?.appointmentId) {
        dispatch(setIncomingCall({
          appointmentId: data.appointmentId,
          callType: (data.callType as CallType) || 'VOICE',
          channelName: data.channelName || `appt_${data.appointmentId}`,
          callerId: data.callerId || '',
          callerName: data.callerName || 'Doctor',
          callerAvatar: data.callerAvatar || null,
        }));
        Notifications.dismissAllNotificationsAsync().catch(() => {});
      }
    };

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleNotificationResponse(response);
      })
      .catch(() => {});

    const sub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => sub.remove();
  }, [dispatch]);

  if (!ready) return null;
  return (
    <>
      {children}
      <IncomingCallOverlay />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider theme={paperTheme}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AuthHydrator>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(patient)" />
              <Stack.Screen name="(doctor)" />
              <Stack.Screen name="call-lobby/[appointmentId]" options={{ animation: 'fade' }} />
              <Stack.Screen name="call/[roomId]" options={{ animation: 'fade' }} />
              <Stack.Screen name="call-summary/[appointmentId]" options={{ animation: 'fade' }} />
            </Stack>
          </AuthHydrator>
        </SafeAreaProvider>
      </PaperProvider>
    </Provider>
  );
}
