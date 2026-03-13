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
import { Button, TextInput, SegmentedButtons, Banner } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRegisterMutation } from '../../src/store/apiSlice';
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
} from '../../src/utils/validators';
import { APP_NAME } from '../../src/utils/constants';
import { AppButton, ScreenContainer } from '../../src/components';
import { Colors, Radius, Spacing, Typography } from '../../src/theme';

export default function RegisterScreen() {
  const [register] = useRegisterMutation();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const accentColor = role === 'doctor' ? Colors.secondary : Colors.primary;

  const validateStep1 = (): boolean => {
    if (!validateName(firstName)) {
      setError('Please enter a valid first name');
      return false;
    }
    if (!validateName(lastName)) {
      setError('Please enter a valid last name');
      return false;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      setError(errors[0]);
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (role === 'doctor' && !specialization.trim()) {
      setError('Please enter specialization');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) setStep(2);
  };

  const handleRegister = async () => {
    setError('');
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      await register({
        role: role === 'doctor' ? 'doctor' : 'patient',
        name: `${firstName} ${lastName}`,
        email,
        password,
        phone,
        ...(role === 'doctor' ? { specialization: specialization.trim() } : {}),
      }).unwrap();
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setError(apiErr?.data?.message || 'Registration failed. Please try again.');
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
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: accentColor + '15' }]}>
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={40}
                color={accentColor}
              />
            </View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>
              Join {APP_NAME} and access healthcare from anywhere
            </Text>
          </View>

          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, { backgroundColor: accentColor }]} />
            <View style={[styles.stepLine, step >= 2 && { backgroundColor: accentColor }]} />
            <View
              style={[
                styles.stepDot,
                step >= 2 ? { backgroundColor: accentColor } : { backgroundColor: Colors.border },
              ]}
            />
          </View>

          <SegmentedButtons
            value={role}
            onValueChange={(v) => {
              setRole(v as 'patient' | 'doctor');
              setError('');
            }}
            buttons={[
              { value: 'patient', label: 'Patient', checkedColor: Colors.primary },
              { value: 'doctor', label: 'Doctor', checkedColor: Colors.secondary },
            ]}
            style={styles.segmented}
          />

          <Banner
            visible={!!error}
            actions={[{ label: 'Dismiss', onPress: () => setError('') }]}
            icon="alert-circle"
            style={styles.banner}
          >
            {error}
          </Banner>

          <View style={styles.formContainer}>
            {step === 1 ? (
              <>
                <TextInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  mode="outlined"
                  left={<TextInput.Icon icon="account-outline" color={Colors.textSecondary} />}
                  style={styles.input}
                  outlineColor={Colors.border}
                  activeOutlineColor={accentColor}
                  textColor={Colors.textPrimary}
                />
                <TextInput
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  mode="outlined"
                  left={<TextInput.Icon icon="account-outline" color={Colors.textSecondary} />}
                  style={styles.input}
                  outlineColor={Colors.border}
                  activeOutlineColor={accentColor}
                  textColor={Colors.textPrimary}
                />
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  left={<TextInput.Icon icon="email-outline" color={Colors.textSecondary} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  outlineColor={Colors.border}
                  activeOutlineColor={accentColor}
                  textColor={Colors.textPrimary}
                />
                <TextInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  mode="outlined"
                  left={<TextInput.Icon icon="phone-outline" color={Colors.textSecondary} />}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.input}
                  outlineColor={Colors.border}
                  activeOutlineColor={accentColor}
                  textColor={Colors.textPrimary}
                />

                <View style={{ marginTop: Spacing.md }}>
                  <AppButton label="Next" onPress={handleNext} buttonColor={accentColor} />
                </View>
              </>
            ) : (
              <>
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
                />
                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  left={<TextInput.Icon icon="lock-check-outline" color={Colors.textSecondary} />}
                  style={styles.input}
                  outlineColor={Colors.border}
                  activeOutlineColor={accentColor}
                  textColor={Colors.textPrimary}
                />

                {role === 'doctor' && (
                  <TextInput
                    label="Specialization"
                    value={specialization}
                    onChangeText={setSpecialization}
                    mode="outlined"
                    left={<TextInput.Icon icon="stethoscope" color={Colors.textSecondary} />}
                    style={styles.input}
                    outlineColor={Colors.border}
                    activeOutlineColor={accentColor}
                    textColor={Colors.textPrimary}
                  />
                )}

                <Text style={styles.genderLabel}>Gender</Text>
                <SegmentedButtons
                  value={gender}
                  onValueChange={(v) => setGender(v as 'male' | 'female' | 'other')}
                  buttons={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  style={styles.genderSegment}
                />

                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setStep(1);
                      setError('');
                    }}
                    style={styles.backButton}
                    contentStyle={styles.backButtonContent}
                    textColor={accentColor}
                  >
                    Back
                  </Button>
                  <View style={styles.registerButton}>
                    <AppButton
                      label={isLoading ? 'Creating...' : 'Create Account'}
                      onPress={handleRegister}
                      loading={isLoading}
                      disabled={isLoading}
                      buttonColor={accentColor}
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginLabel}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.loginLink, { color: accentColor }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: Spacing.xxl },
  header: { alignItems: 'flex-start', marginBottom: Spacing.xl, marginTop: Spacing.xl },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: {
    fontSize: Typography.size.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: '400',
  },
  stepIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxl,
  },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLine: { width: 48, height: 3, backgroundColor: Colors.border, marginHorizontal: 8, borderRadius: 2 },
  segmented: { marginBottom: Spacing.xxl },
  formContainer: { marginBottom: Spacing.xl },
  banner: { marginBottom: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.errorLight },
  input: { marginBottom: Spacing.md, backgroundColor: Colors.background, fontSize: Typography.size.md },
  genderLabel: {
    fontSize: Typography.size.md, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.sm
  },
  genderSegment: { marginBottom: Spacing.xxl },
  buttonRow: { flexDirection: 'row', gap: 16, marginBottom: Spacing.xl },
  backButton: { flex: 1, borderRadius: Radius.md, borderColor: Colors.border, borderWidth: 1.5, justifyContent: 'center' },
  backButtonContent: { paddingVertical: Spacing.sm },
  registerButton: { flex: 2 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  loginLabel: { fontSize: Typography.size.md, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.size.md, fontWeight: '700' },
});
