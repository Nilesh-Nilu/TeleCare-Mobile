import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, RadioButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useGetPlansQuery, useSubscribePlanMutation } from '../../../src/store/apiSlice';
import { AppHeader, LoadingScreen } from '../../../src/components';
import { formatCurrency } from '../../../src/utils/formatters';
import { Colors } from '../../../src/theme';

const gateways = [
  { value: 'razorpay', label: 'Razorpay', icon: 'credit-card-outline' },
  { value: 'upi', label: 'UPI', icon: 'cellphone' },
  { value: 'netbanking', label: 'Net Banking', icon: 'bank-outline' },
];

export default function PaymentScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { data } = useGetPlansQuery(undefined);
  const [subscribePlan] = useSubscribePlanMutation();
  const plans = data?.data || [];
  const plan = plans.find((p: any) => String(p.id) === planId);

  const [gateway, setGateway] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!plan) return <LoadingScreen />;

  const handlePay = async () => {
    setProcessing(true);
    try {
      await subscribePlan({ planId: Number(planId) }).unwrap();
      setSuccess(true);
    } catch {
      // handled by RTK
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-circle" size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSub}>
            You have subscribed to {plan.name}. Enjoy your consultations!
          </Text>
          <Button
            mode="contained"
            onPress={() => router.replace('/(patient)/subscription/active')}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            View Subscription
          </Button>
          <Button mode="text" onPress={() => router.replace('/(patient)')} textColor={Colors.primary}>
            Go Home
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Payment" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.orderTitle}>Order Summary</Text>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>{plan.name}</Text>
              <Text style={styles.orderValue}>{formatCurrency(plan.price)}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.orderRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(plan.price)}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.orderTitle}>Payment Method</Text>
            <RadioButton.Group onValueChange={setGateway} value={gateway}>
              {gateways.map((g) => (
                <View key={g.value} style={styles.gatewayRow}>
                  <MaterialCommunityIcons name={g.icon as any} size={22} color={Colors.textSecondary} />
                  <Text style={styles.gatewayLabel}>{g.label}</Text>
                  <RadioButton value={g.value} color={Colors.primary} />
                </View>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={handlePay}
          loading={processing}
          disabled={processing}
          style={styles.btn}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
          icon="lock"
        >
          {processing ? 'Processing...' : `Pay ${formatCurrency(plan.price)}`}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 120 },
  card: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 16 },
  orderTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  orderLabel: { fontSize: 14, color: Colors.textSecondary },
  orderValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  divider: { marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  gatewayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8,
  },
  gatewayLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 32, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  btn: { borderRadius: 12 },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '600' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  successSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
