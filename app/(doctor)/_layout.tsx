import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadows, Spacing, Typography } from '../../src/theme';
import { useSelector } from 'react-redux';
import type { RootState } from '../../src/store';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Dashboard', icon: 'view-dashboard-outline' },
  { name: 'schedule', title: 'Schedule', icon: 'clock-outline' },
  { name: 'earnings', title: 'Earnings', icon: 'wallet-outline' },
  { name: 'profile', title: 'Profile', icon: 'account-outline' },
];

export default function DoctorLayout() {
  const { isAuthenticated, isHydrated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/(auth)/doctor-login');
    }
  }, [isAuthenticated, isHydrated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { paddingBottom: 94 },
        tabBarActiveTintColor: Colors.secondary,
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
      <Tabs.Screen name="queue" options={{ href: null }} />
      <Tabs.Screen name="consultation/[id]" options={{ href: null }} />
      <Tabs.Screen name="prescribe/[appointmentId]" options={{ href: null }} />
      <Tabs.Screen name="patient-records/[id]" options={{ href: null }} />
    </Tabs>
  );
}
