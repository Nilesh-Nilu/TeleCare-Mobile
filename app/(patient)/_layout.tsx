import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadows, Spacing, Typography } from '../../src/theme';
import { useSelector } from 'react-redux';
import type { RootState } from '../../src/store';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline' },
  { name: 'appointments/index', title: 'Appointments', icon: 'calendar-outline' },
  { name: 'prescriptions/index', title: 'Prescriptions', icon: 'file-document-outline' },
  { name: 'profile', title: 'Profile', icon: 'account-outline' },
];

export default function PatientLayout() {
  const { isAuthenticated, isHydrated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isHydrated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { paddingBottom: 94 },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          borderTopWidth: 0,
          backgroundColor: Colors.white,
          height: 72,
          borderRadius: 22,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.sm,
          ...Shadows.lg,
        },
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: Typography.size.xs,
          fontWeight: Typography.weight.semibold,
          marginTop: 1,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
      {/* Hidden tabs — accessible via navigation but not shown in tab bar */}
      <Tabs.Screen name="doctors/index" options={{ href: null }} />
      <Tabs.Screen name="doctors/[id]" options={{ href: null }} />
      <Tabs.Screen name="doctor-slots/[id]" options={{ href: null }} />
      <Tabs.Screen name="booking-confirm" options={{ href: null }} />
      <Tabs.Screen name="appointments/[id]" options={{ href: null }} />
      <Tabs.Screen name="prescriptions/[id]" options={{ href: null }} />
      <Tabs.Screen name="medical-records" options={{ href: null }} />
      <Tabs.Screen name="upload-reports" options={{ href: null }} />
      <Tabs.Screen name="vitals" options={{ href: null }} />
      <Tabs.Screen name="subscription/index" options={{ href: null }} />
      <Tabs.Screen name="subscription/[planId]" options={{ href: null }} />
      <Tabs.Screen name="subscription-pay/[planId]" options={{ href: null }} />
      <Tabs.Screen name="subscription/active" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
