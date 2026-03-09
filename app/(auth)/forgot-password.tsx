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
import { Button, TextInput, Banner } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { validateEmail } from '../../src/utils/validators';
import { Colors } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      setSent(true);
    } catch {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="email-check-outline" size={56} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successSubtitle}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Button
            mode="contained"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            labelStyle={styles.primaryButtonLabel}
          >
            Back to Login
          </Button>
          <TouchableOpacity onPress={() => setSent(false)}>
            <Text style={styles.resendText}>Didn't receive? Send again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="lock-reset" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Forgot Password?</Text>
            <Text style={styles.headerSubtitle}>
              Enter the email address associated with your account and we'll send a reset link
            </Text>
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
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" color={Colors.textSecondary} />}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              textColor={Colors.textPrimary}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </View>

          <TouchableOpacity style={styles.loginRow} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginText}>Remember your password? </Text>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  backRow: { marginBottom: 24 },
  header: { alignItems: 'flex-start', marginBottom: 32 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: {
    fontSize: 16, color: Colors.textSecondary, marginTop: 12,
    lineHeight: 24, fontWeight: '400',
  },
  formContainer: { marginBottom: 32 },
  banner: { marginBottom: 16, borderRadius: 12, backgroundColor: Colors.errorLight },
  input: { marginBottom: 24, backgroundColor: Colors.background, fontSize: 16 },
  primaryButton: { borderRadius: 16, marginBottom: 20, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonContent: { paddingVertical: 8 },
  primaryButtonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 16, color: Colors.textSecondary },
  loginLink: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  successContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  successSubtitle: {
    fontSize: 16, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 24, marginBottom: 32,
  },
  emailHighlight: { fontWeight: '700', color: Colors.textPrimary },
  resendText: {
    fontSize: 16, fontWeight: '700', color: Colors.primary, marginTop: 24,
  },
});
