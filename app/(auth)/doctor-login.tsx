import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Banner, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppDispatch } from '../../src/store';
import { setUser, setTokens } from '../../src/slices/authSlice';
import { setAccessToken } from '../../src/services/api';
import { useLoginMutation } from '../../src/store/apiSlice';
import { validateEmail, validatePhone } from '../../src/utils/validators';
import { APP_NAME } from '../../src/utils/constants';
import { AppButton, AppCard, ScreenContainer } from '../../src/components';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

const features = [
  { icon: 'account-group' as const, label: 'Manage Patients' },
  { icon: 'video' as const, label: 'Video Consults' },
  { icon: 'file-document' as const, label: 'E-Prescriptions' },
];

export default function DoctorLoginScreen() {
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();
  const [emailOrReg, setEmailOrReg] = useState('dr.priya@telecare.com');
  const [password, setPassword] = useState('Doctor@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!emailOrReg.trim()) {
      setError('Please enter your email or registration number');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    if (
      !validateEmail(emailOrReg) &&
      !validatePhone(emailOrReg) &&
      emailOrReg.length < 4
    ) {
      setError('Please enter a valid email or registration number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ email: emailOrReg, password }).unwrap();
      const { data } = result;
      const tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn || 900,
      };
      setAccessToken(tokens.accessToken);
      dispatch(setTokens(tokens));

      const nameParts = (data.user?.name || '').split(' ');
      const user = {
        id: String(data.user?.id || ''),
        email: data.user?.email || emailOrReg,
        phone: data.user?.phone || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        role: 'doctor' as const,
        isOnline: Boolean(data.user?.isOnline),
        isVerified: true,
        createdAt: data.user?.createdAt || new Date().toISOString(),
      };
      dispatch(setUser(user));
      router.replace('/(doctor)');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setError(apiErr?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header banner */}
          <View style={styles.bannerHeader}>
            <View style={styles.bannerCircleTopRight} />
            <View style={styles.bannerCircleBottomLeft} />

            <SafeAreaView edges={['top']} style={styles.bannerContent}>
              <View style={styles.bannerTitleRow}>
                <View style={styles.bannerIconBox}>
                  <MaterialCommunityIcons
                    name="hospital-box"
                    size={28}
                    color={Colors.white}
                  />
                </View>
                <View>
                  <Text style={styles.bannerAppName}>{APP_NAME}</Text>
                  <Text style={styles.bannerTitle}>Doctor Portal</Text>
                </View>
              </View>

              <Text style={styles.bannerSubtitle}>
                Manage your practice, consult patients, and grow your career — all
                in one place.
              </Text>

              <View style={styles.chipRow}>
                {features.map((f) => (
                  <Chip
                    key={f.label}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={f.icon}
                        size={16}
                        color="rgba(255,255,255,0.9)"
                      />
                    )}
                    textStyle={styles.chipText}
                    style={styles.chip}
                    compact
                  >
                    {f.label}
                  </Chip>
                ))}
              </View>
            </SafeAreaView>
          </View>

          {/* Login card */}
          <View style={styles.cardWrapper}>
            <AppCard style={styles.card}>
                <View style={styles.verifiedRow}>
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={18}
                    color={Colors.secondary}
                  />
                  <Text style={styles.verifiedText}>
                    Verified Practitioners Only
                  </Text>
                </View>

                <Banner
                  visible={!!error}
                  actions={[{ label: 'Dismiss', onPress: () => setError('') }]}
                  icon="alert-circle"
                  style={styles.errorBanner}
                >
                  {error}
                </Banner>

                <TextInput
                  label="Email or Registration Number"
                  placeholder="dr.name@email.com or MCI-XXXXX"
                  value={emailOrReg}
                  onChangeText={setEmailOrReg}
                  mode="outlined"
                  left={
                    <TextInput.Icon
                      icon="email-outline"
                      color={Colors.secondary}
                    />
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.secondary}
                  textColor={Colors.textPrimary}
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  left={
                    <TextInput.Icon
                      icon="lock-outline"
                      color={Colors.secondary}
                    />
                  }
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                      color={Colors.secondary}
                    />
                  }
                  style={styles.input}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.secondary}
                  textColor={Colors.textPrimary}
                />

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  style={styles.forgotRow}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <AppButton
                  label={isLoading ? 'Signing in...' : 'Sign In to Portal'}
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  buttonColor={Colors.secondary}
                />
            </AppCard>
          </View>

          {/* Bottom links */}
          <View style={styles.bottomLinks}>
            <View style={styles.linkRow}>
              <Text style={styles.linkLabel}>New to {APP_NAME}? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Register as Doctor</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.patientLinkRow}
            >
              <Text style={styles.patientLinkText}>
                Are you a patient? Sign in here
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  bannerHeader: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerCircleTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bannerCircleBottomLeft: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bannerContent: {
    position: 'relative',
    zIndex: 1,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  bannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAppName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    lineHeight: 24,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 21,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  chipText: {
    color: Colors.white,
    fontSize: 11,
  },
  cardWrapper: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
  },
  card: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },
  errorBanner: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.errorLight,
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
    fontSize: Typography.size.md,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },
  bottomLinks: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  patientLinkRow: {
    marginBottom: 8,
  },
  patientLinkText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
