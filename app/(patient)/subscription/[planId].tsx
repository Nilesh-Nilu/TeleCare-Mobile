import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useGetPlansQuery } from '../../../src/store/apiSlice';
import { AppHeader, LoadingScreen } from '../../../src/components';
import { formatCurrency } from '../../../src/utils/formatters';
import { Colors } from '../../../src/theme';

export default function PlanDetailScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { data, isLoading } = useGetPlansQuery(undefined);
  const plans = data?.data || [];
  const plan = plans.find((p: any) => String(p.id) === planId);

  if (isLoading) return <LoadingScreen />;
  if (!plan) return <LoadingScreen />;

  const isPremium = plan.tier === 'PREMIUM';
  const features = Array.isArray(plan.features)
    ? plan.features
    : typeof plan.features === 'string'
      ? plan.features
          .split(',')
          .map((f: string) => f.trim())
          .filter(Boolean)
      : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Plan Details" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.tierRow}>
              <View style={[styles.tierBadge, { backgroundColor: isPremium ? '#8B5CF618' : '#3B82F618' }]}>
                <MaterialCommunityIcons
                  name={isPremium ? 'video' : 'phone'}
                  size={16}
                  color={isPremium ? '#8B5CF6' : '#3B82F6'}
                />
                <Text style={[styles.tierText, { color: isPremium ? '#8B5CF6' : '#3B82F6' }]}>
                  {isPremium ? 'Premium — Video Calling' : 'Base — Voice Calling'}
                </Text>
              </View>
            </View>

            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatCurrency(plan.price)}</Text>
              {plan.originalPrice > plan.price && (
                <Text style={styles.origPrice}>{formatCurrency(plan.originalPrice)}</Text>
              )}
              <Text style={styles.period}>/ {plan.type}</Text>
            </View>

            <View style={styles.callTypeRow}>
              <MaterialCommunityIcons
                name={isPremium ? 'video-outline' : 'phone-outline'}
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.callTypeText}>
                {isPremium
                  ? `${plan.maxConsultations} video + voice consultations`
                  : `${plan.maxConsultations} voice-only consultations`}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.featuresTitle}>What's Included</Text>
            {features.map((f: string, i: number) => (
              <View key={i} style={styles.featureRow}>
                <MaterialCommunityIcons name="check-circle" size={18} color={Colors.success} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
            {features.length === 0 && (
              <Text style={styles.featureText}>Plan benefits will be shown here</Text>
            )}

            {!isPremium && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.upgradeHint}>
                  <MaterialCommunityIcons name="information-outline" size={18} color={Colors.warning} />
                  <Text style={styles.upgradeText}>
                    Upgrade to Premium for video consultations with your doctor
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatCurrency(plan.price)}</Text>
        </View>
        <Button
          mode="contained"
          onPress={() => router.push(`/(patient)/subscription-pay/${planId}`)}
          style={styles.btn}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
        >
          Subscribe Now
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 120 },
  card: { backgroundColor: Colors.white, borderRadius: 16 },
  tierRow: { marginBottom: 8 },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  tierText: { fontSize: 12, fontWeight: '700' },
  planName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  price: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  origPrice: { fontSize: 16, color: Colors.textTertiary, textDecorationLine: 'line-through' },
  period: { fontSize: 14, color: Colors.textSecondary },
  callTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  callTypeText: { fontSize: 14, color: Colors.textSecondary },
  divider: { marginVertical: 20 },
  featuresTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  featureText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  upgradeHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12,
  },
  upgradeText: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 32, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 15, color: Colors.textSecondary },
  totalPrice: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  btn: { borderRadius: 12 },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '600' },
});
