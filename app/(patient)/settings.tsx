import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Card, Switch, Divider, List, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppDispatch } from '../../src/store';
import { logout } from '../../src/slices/authSlice';
import { setAccessToken } from '../../src/services/api';
import { AppHeader } from '../../src/components';
import { APP_NAME, APP_VERSION } from '../../src/utils/constants';
import { confirmAlert } from '../../src/utils/alert';
import { Colors } from '../../src/theme';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const handleLogout = () => {
    confirmAlert('Logout', 'Are you sure?', () => {
      dispatch(logout());
      setAccessToken(null);
      router.replace('/(auth)/login');
    }, undefined, 'Logout');
  };

  const handleDeleteAccount = () => {
    confirmAlert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted.',
      () => {},
      undefined,
      'Delete',
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Settings" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <Card style={styles.card}>
          <List.Item
            title="Push Notifications"
            left={(p) => <List.Icon {...p} icon="bell-outline" color={Colors.textSecondary} />}
            right={() => <Switch value={pushNotif} onValueChange={setPushNotif} color={Colors.primary} />}
          />
          <Divider />
          <List.Item
            title="Email Notifications"
            left={(p) => <List.Icon {...p} icon="email-outline" color={Colors.textSecondary} />}
            right={() => <Switch value={emailNotif} onValueChange={setEmailNotif} color={Colors.primary} />}
          />
        </Card>

        <Text style={styles.sectionLabel}>Security</Text>
        <Card style={styles.card}>
          <List.Item
            title="Biometric Login"
            description="Use Face ID or fingerprint"
            left={(p) => <List.Icon {...p} icon="fingerprint" color={Colors.textSecondary} />}
            right={() => <Switch value={biometric} onValueChange={setBiometric} color={Colors.primary} />}
          />
          <Divider />
          <List.Item
            title="Change Password"
            left={(p) => <List.Icon {...p} icon="lock-outline" color={Colors.textSecondary} />}
            right={(p) => <List.Icon {...p} icon="chevron-right" color={Colors.textTertiary} />}
            onPress={() => {}}
          />
        </Card>

        <Text style={styles.sectionLabel}>Support</Text>
        <Card style={styles.card}>
          <List.Item
            title="Help & FAQ"
            left={(p) => <List.Icon {...p} icon="help-circle-outline" color={Colors.textSecondary} />}
            right={(p) => <List.Icon {...p} icon="chevron-right" color={Colors.textTertiary} />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Contact Support"
            left={(p) => <List.Icon {...p} icon="headphones" color={Colors.textSecondary} />}
            right={(p) => <List.Icon {...p} icon="chevron-right" color={Colors.textTertiary} />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Terms & Privacy"
            left={(p) => <List.Icon {...p} icon="shield-outline" color={Colors.textSecondary} />}
            right={(p) => <List.Icon {...p} icon="chevron-right" color={Colors.textTertiary} />}
            onPress={() => {}}
          />
        </Card>

        <Text style={styles.sectionLabel}>Account</Text>
        <Card style={styles.card}>
          <List.Item
            title="Log Out"
            titleStyle={{ color: Colors.error }}
            left={(p) => <List.Icon {...p} icon="logout" color={Colors.error} />}
            onPress={handleLogout}
          />
          <Divider />
          <List.Item
            title="Delete Account"
            titleStyle={{ color: Colors.error }}
            left={(p) => <List.Icon {...p} icon="delete-outline" color={Colors.error} />}
            onPress={handleDeleteAccount}
          />
        </Card>

        <Text style={styles.version}>{APP_NAME} v{APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 32 },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: { backgroundColor: Colors.white, marginHorizontal: 16, borderRadius: 12 },
  version: {
    fontSize: 12, color: Colors.textTertiary, textAlign: 'center',
    marginTop: 24, marginBottom: 8,
  },
});
