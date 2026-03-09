import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, Divider, Modal, Portal, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../src/store';
import { useGetProfileQuery } from '../../src/store/apiSlice';
import { logout, setUser } from '../../src/slices/authSlice';
import { setAccessToken } from '../../src/services/api';
import { AppButton, AppCard, Avatar, LoadingScreen, ScreenContainer } from '../../src/components';
import { formatPhoneNumber } from '../../src/utils/formatters';
import { getDisplayName } from '../../src/utils/name';
import { confirmAlert } from '../../src/utils/alert';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

const menuItems = [
  { icon: 'calendar-outline', label: 'My Appointments', route: '/(patient)/appointments' },
  { icon: 'file-document-outline', label: 'Prescriptions', route: '/(patient)/prescriptions' },
  { icon: 'folder-outline', label: 'Medical Records', route: '/(patient)/records' },
  { icon: 'heart-pulse', label: 'Health Vitals', route: '/(patient)/vitals' },
  { icon: 'star-outline', label: 'Subscription', route: '/(patient)/subscription' },
  { icon: 'credit-card-outline', label: 'Payment History', route: '/(patient)/payments' },
  { icon: 'cog-outline', label: 'Settings', route: '/(patient)/settings' },
];

export default function PatientProfileScreen() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const { data } = useGetProfileQuery(undefined);
  const profile = data?.data || user;
  const [localProfile, setLocalProfile] = React.useState<any>(null);
  const [editVisible, setEditVisible] = React.useState(false);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const currentProfile = localProfile || profile;

  if (!currentProfile) return <LoadingScreen />;

  const first = (currentProfile.firstName || currentProfile.name?.split(' ')[0] || '').trim();
  const last = (currentProfile.lastName || currentProfile.name?.split(' ').slice(1).join(' ') || '').trim();
  const fullName = getDisplayName(currentProfile, { fallback: 'User' });

  const openEditModal = () => {
    setFirstName(first || '');
    setLastName(last || '');
    setPhone(currentProfile.phone || '');
    setEditVisible(true);
  };

  const handleLogout = () => {
    confirmAlert('Logout', 'Are you sure you want to log out?', () => {
      dispatch(logout());
      setAccessToken(null);
      router.replace('/(auth)/login');
    }, undefined, 'Logout');
  };

  const handleSaveProfile = () => {
    const safeFirst = firstName.trim() || first || 'User';
    const safeLast = lastName.trim();
    const updatedProfile = {
      ...currentProfile,
      firstName: safeFirst,
      lastName: safeLast,
      phone: phone.trim(),
    };
    setLocalProfile(updatedProfile);
    if (user) {
      dispatch(
        setUser({
          ...user,
          firstName: safeFirst,
          lastName: safeLast,
          phone: phone.trim(),
        }),
      );
    }
    setEditVisible(false);
  };

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>My Profile</Text>
            <TouchableOpacity onPress={openEditModal} activeOpacity={0.85} style={styles.editBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.white} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.profileBlock}>
            <Avatar name={fullName} size={72} uri={currentProfile.avatar} />
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{currentProfile.email || 'No email'}</Text>
            {currentProfile.phone && (
              <Text style={styles.phone}>{formatPhoneNumber(currentProfile.phone)}</Text>
            )}
          </View>
        </View>

        <AppCard style={styles.menuCard} padded={false}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuHeaderText}>Quick Access</Text>
          </View>
          <Divider />
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.label}>
              {idx > 0 && <Divider />}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.menuIconWrap}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </AppCard>

        <View style={styles.logoutWrap}>
          <AppButton
            label="Log Out"
            onPress={handleLogout}
            variant="secondary"
            mode="outlined"
            textColor={Colors.error}
            borderColor={Colors.error}
          />
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={editVisible}
          onDismiss={() => setEditVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 14 }}
          />
          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 14 }}
          />
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            theme={{ roundness: 14 }}
          />
          <View style={styles.modalActions}>
            <Button mode="text" onPress={() => setEditVisible(false)} textColor={Colors.textSecondary}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSaveProfile} style={styles.saveBtn}>
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F6FB',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    letterSpacing: 0.3,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  editBtnText: {
    color: Colors.white,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  profileBlock: {
    alignItems: 'center',
  },
  name: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  email: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  phone: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: Spacing.xl,
  },
  menuHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuHeaderText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  menuIconWrap: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
  },
  logoutWrap: {
    marginBottom: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: '#F8FAFC',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  saveBtn: {
    borderRadius: 10,
  },
});
