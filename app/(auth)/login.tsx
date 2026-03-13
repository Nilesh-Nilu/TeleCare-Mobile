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
import { TextInput, Banner } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppDispatch } from '../../src/store';
import { setUser, setTokens } from '../../src/slices/authSlice';
import { setAccessToken } from '../../src/services/api';
import { useLoginMutation } from '../../src/store/apiSlice';
import { validateEmail, validatePhone } from '../../src/utils/validators';
import { APP_NAME } from '../../src/utils/constants';
import { AppButton, ScreenContainer } from '../../src/components';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function LoginScreen() {
  const creds = {
    patient: { email: 'smoke.patient.1773206273@gmail.com', password: 'Pass@123' },
    doctor:  { email: 'smoke.doctor.1773206273@gmail.com',      password: 'Pass@123' },
  };

  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [emailOrPhone, setEmailOrPhone] = useState(creds.patient.email);
  const [password, setPassword] = useState(creds.patient.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isDoctor = role === 'doctor';
  const accentColor = isDoctor ? Colors.secondary : Colors.primary;

  const handleLogin = async () => {
    setError('');
    if (!emailOrPhone.trim()) {
      setError('Please enter your email or phone number');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    if (!validateEmail(emailOrPhone) && !validatePhone(emailOrPhone)) {
      setError('Please enter a valid email or phone number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ email: emailOrPhone, password }).unwrap();
      const { data } = result;
      const tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn || 900,
      };
      setAccessToken(tokens.accessToken);
      dispatch(setTokens(tokens));

      const apiRole = (data.role || '').toUpperCase();
      const mappedRole: 'patient' | 'doctor' | 'admin' | 'support' =
        apiRole === 'DOCTOR'
          ? 'doctor'
          : apiRole === 'ADMIN'
            ? 'admin'
            : apiRole === 'SUPPORT'
              ? 'support'
              : 'patient';
      const nameParts = String(data.name || '').split(' ');
      const user = {
        id: String(data.id || ''),
        email: data.email || emailOrPhone,
        phone: data.phone || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        role: mappedRole,
        avatar: undefined,
        isOnline: false,
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      dispatch(setUser(user));
      router.replace(user.role === 'doctor' ? '/(doctor)' : '/(patient)');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; error?: string; status?: number | string };
      setError(
        apiErr?.data?.message ||
          apiErr?.error ||
          (apiErr?.status ? `Login failed (${apiErr.status}).` : '') ||
          'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.topPanel, { backgroundColor: accentColor }]}>
            <View style={styles.topPanelRow}>
              <View style={styles.topIconWrap}>
                <MaterialCommunityIcons
                  name={isDoctor ? 'stethoscope' : 'heart-pulse'}
                  size={24}
                  color={accentColor}
                />
              </View>
              <View>
                <Text style={styles.topPanelBrand}>{APP_NAME}</Text>
                <Text style={styles.topPanelTitle}>
                  {isDoctor ? 'Doctor Sign In' : 'Patient Sign In'}
                </Text>
              </View>
            </View>
            <Text style={styles.topPanelSubtitle}>
              {isDoctor ? 'Access consultations, queue and records' : 'Book appointments and manage your health'}
            </Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.roleSwitch}>
              <TouchableOpacity
                onPress={() => {
                  setRole('patient');
                  setEmailOrPhone(creds.patient.email);
                  setPassword(creds.patient.password);
                  setError('');
                }}
                style={[
                  styles.rolePill,
                  role === 'patient' && styles.rolePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.rolePillText,
                    role === 'patient' && { color: Colors.primary },
                  ]}
                >
                  Patient
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setRole('doctor');
                  setEmailOrPhone(creds.doctor.email);
                  setPassword(creds.doctor.password);
                  setError('');
                }}
                style={[
                  styles.rolePill,
                  role === 'doctor' && styles.rolePillActive,
                ]}
              >
                <Text
                  style={[
                    styles.rolePillText,
                    role === 'doctor' && { color: Colors.secondary },
                  ]}
                >
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>

            <Banner
              visible={!!error}
              actions={[{ label: 'Dismiss', onPress: () => setError('') }]}
              icon="alert-circle"
              style={styles.banner}
            >
              {error}
            </Banner>

            <View style={styles.formContainer}>
              <TextInput
                label={isDoctor ? 'Email or Registration No.' : 'Email or Phone Number'}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                mode="outlined"
                left={<TextInput.Icon icon="account-circle-outline" color={Colors.textSecondary} />}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineColor={Colors.border}
                activeOutlineColor={accentColor}
                textColor={Colors.textPrimary}
                theme={{ roundness: 16 }}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                left={<TextInput.Icon icon="lock-outline" color={Colors.textSecondary} />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                    color={Colors.textSecondary}
                  />
                }
                style={styles.input}
                outlineColor={Colors.border}
                activeOutlineColor={accentColor}
                textColor={Colors.textPrimary}
                theme={{ roundness: 16 }}
              />

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotRow}
              >
                <Text style={[styles.forgotText, { color: accentColor }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <AppButton
                label={
                  isLoading ? 'Signing in...' : isDoctor ? 'Sign In as Doctor' : 'Sign In'
                }
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                buttonColor={accentColor}
              />
            </View>
            <View style={styles.signupRow}>
              {role !== 'doctor' &&
                <>
                  <Text style={styles.signupLabel}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                    <Text style={[styles.signupLink, { color: accentColor }]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </>
              }
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',

  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    flexGrow: 1,
    justifyContent: "center"
  },
  topPanel: {
    borderRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    marginBottom: -Spacing.xxl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  topPanelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  topIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  topPanelBrand: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  topPanelTitle: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: Typography.weight.bold,
    marginTop: 2,
  },
  topPanelSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Typography.size.md,
    lineHeight: 20,
  },
  authCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 7,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  rolePill: {
    flex: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: Colors.white,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  rolePillText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  formContainer: {
    marginBottom: Spacing.lg,
  },
  banner: {
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.errorLight,
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: '#F8FAFC',
    fontSize: Typography.size.md,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
    marginTop: 2,
  },
  forgotText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  googleButton: {
    borderRadius: Radius.md,
    borderColor: '#D8E1EC',
    borderWidth: 1.2,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.white,
  },
  googleButtonContent: {
    paddingVertical: Spacing.sm,
  },
  googleButtonLabel: {
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupLabel: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
});
