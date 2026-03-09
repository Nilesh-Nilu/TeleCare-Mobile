import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector } from '../src/store';
import { Colors } from '../src/theme';

export default function Index() {
  const { isAuthenticated, isFirstLaunch, isHydrated, user } = useAppSelector((s) => s.auth);

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={isFirstLaunch ? '/(auth)/onboarding' : '/(auth)/login'} />;
  }

  return <Redirect href={user?.role === 'doctor' ? '/(doctor)' : '/(patient)'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});
