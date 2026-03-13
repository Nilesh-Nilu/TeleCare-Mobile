import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  useGetPlansQuery,
  useGetSubscriptionStatusQuery,
  useSubscribePlanMutation,
} from '../../../src/store/apiSlice';
import { AppHeader, LoadingScreen } from '../../../src/components';
import { formatCurrency } from '../../../src/utils/formatters';
import { Colors } from '../../../src/theme';
import type { SubscriptionPlan } from '../../../src/types';

type BillingCycle = 'monthly' | 'yearly';

const TIER_META: Record<string, {
  color: string; bg: string; border: string;
  icon: 'phone' | 'video' | 'star'; label: string;
  callLabel: string; callIcon: 'phone' | 'video' | 'star';
  callColor: string; desc: string;
}> = {
  BASE: {
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: 'phone',
    label: 'Voice',
    callLabel: 'Voice Only',
    callIcon: 'phone',
    callColor: '#3B82F6',
    desc: 'Talk to your doctor over voice call',
  },
  BASIC: {
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: 'phone',
    label: 'Basic',
    callLabel: 'Voice Only',
    callIcon: 'phone',
    callColor: '#3B82F6',
    desc: 'Talk to your doctor over voice call',
  },
  STANDARD: {
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: 'star',
    label: 'Standard',
    callLabel: 'Voice + Video',
    callIcon: 'video',
    callColor: '#F59E0B',
    desc: 'Priority consultations with video support',
  },
  PREMIUM: {
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    icon: 'video',
    label: 'Video',
    callLabel: 'Video + Voice',
    callIcon: 'video',
    callColor: '#8B5CF6',
    desc: 'Face-to-face HD video consultations',
  },
};

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { data: planData, isLoading } = useGetPlansQuery(undefined);
  const { data: statusData } = useGetSubscriptionStatusQuery(undefined);
  const [subscribePlan] = useSubscribePlanMutation();
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');

  const plans: SubscriptionPlan[] = planData?.data || [];
  const activeSub = statusData?.data;

  const filtered = plans.filter((p) => {
    const t = (p as any).type as string;
    if (!t) return true; // show plans with no type in both cycles
    if (billing === 'monthly') return t === 'monthly';
    return t === 'yearly' || t === 'annual';
  });

  // Fallback: show all plans if filter yields nothing
  const sorted = [...(filtered.length ? filtered : plans)].sort((a, b) => {
    if (a.tier === 'BASE' && b.tier !== 'BASE') return -1;
    if (a.tier !== 'BASE' && b.tier === 'BASE') return 1;
    return a.price - b.price;
  });

  const selectedPlan = sorted.find((p) => String(p.id) === selectedPlanId) ?? null;

  const handlePurchaseNow = async () => {
    setError('');
    if (!selectedPlan) {
      setError('Please select a plan first.');
      return;
    }
    setPurchasing(true);
    try {
      await subscribePlan({ planId: Number(selectedPlan.id) }).unwrap();
      setSelectedPlanId(null);
      router.replace('/(patient)/subscription/active');
    } catch (err: any) {
      const message = err?.data?.message || 'Purchase failed. Please try again.';
      setError(message);
      Alert.alert('Purchase Failed', message);
    } finally {
      setPurchasing(false);
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Choose a Plan" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Consult Doctors Anytime</Text>
          <Text style={styles.heroSub}>
            Subscribe to unlock consultations.{'\n'}
            Premium plans include HD video calls.
          </Text>
        </View>

        {/* Active subscription banner */}
        {activeSub?.status === 'active' && (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => router.push('/(patient)/subscription/active')}
            activeOpacity={0.8}
          >
            <View style={styles.activeBannerLeft}>
              <MaterialCommunityIcons name="shield-check" size={20} color={Colors.success} />
              <View>
                <Text style={styles.activeBannerTitle}>Active: {activeSub.plan?.name}</Text>
                <Text style={styles.activeBannerSub}>
                  {activeSub.plan?.tier === 'PREMIUM' ? 'Video + Voice Calls enabled' : 'Voice Calls enabled'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.success} />
          </TouchableOpacity>
        )}

        {/* Call type comparison */}
        <View style={styles.compareRow}>
          <View style={[styles.compareChip, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <MaterialCommunityIcons name="phone" size={16} color="#3B82F6" />
            <Text style={[styles.compareChipText, { color: '#3B82F6' }]}>Voice Plan</Text>
            <Text style={styles.compareChipSub}>Voice calls only</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.textTertiary} />
          <View style={[styles.compareChip, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
            <MaterialCommunityIcons name="video" size={16} color="#8B5CF6" />
            <Text style={[styles.compareChipText, { color: '#8B5CF6' }]}>Video Plan</Text>
            <Text style={styles.compareChipSub}>Video + Voice calls</Text>
          </View>
        </View>

        {/* Billing toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[styles.billingBtn, billing === 'monthly' && styles.billingBtnActive]}
            onPress={() => setBilling('monthly')}
          >
            <Text style={[styles.billingBtnText, billing === 'monthly' && styles.billingBtnTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingBtn, billing === 'yearly' && styles.billingBtnActive]}
            onPress={() => setBilling('yearly')}
          >
            <Text style={[styles.billingBtnText, billing === 'yearly' && styles.billingBtnTextActive]}>
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 33%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plan cards */}
        {sorted.map((plan) => {
          const meta = TIER_META[plan.tier] ?? TIER_META.BASE;
          const isActive = activeSub?.status === 'active' && String(activeSub.planId) === String(plan.id);
          const isSelected = String(plan.id) === selectedPlanId;
          const isPremium = plan.tier === 'PREMIUM';
          const features = Array.isArray((plan as any).features)
            ? (plan as any).features
            : typeof (plan as any).features === 'string'
              ? (plan as any).features.split(',').map((f: string) => f.trim()).filter(Boolean)
              : [];

          const cardBorderColor = isActive
            ? Colors.success
            : isSelected
              ? meta.color
              : plan.isPopular
                ? meta.color
                : meta.border;

          return (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.85}
              onPress={() => {
                if (isActive) {
                  router.push('/(patient)/subscription/active');
                } else {
                  setSelectedPlanId(isSelected ? null : String(plan.id));
                }
              }}
              style={[
                styles.planCard,
                { borderColor: cardBorderColor },
                (isActive || plan.isPopular || isSelected) && styles.planCardHighlighted,
                isSelected && { borderWidth: 2.5 },
              ]}
            >
              {isActive && (
                <View style={[styles.planBadge, { backgroundColor: Colors.success }]}>
                  <Text style={styles.planBadgeText}>YOUR PLAN</Text>
                </View>
              )}
              {!isActive && isSelected && (
                <View style={[styles.planBadge, { backgroundColor: meta.color }]}>
                  <Text style={styles.planBadgeText}>SELECTED</Text>
                </View>
              )}
              {!isActive && !isSelected && plan.isPopular && (
                <View style={[styles.planBadge, { backgroundColor: meta.color }]}>
                  <Text style={styles.planBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={[styles.planIconBox, { backgroundColor: meta.bg }]}>
                  <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
                </View>
                <View style={styles.planTitleBlock}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={[styles.planCallType, { color: meta.color }]}>{meta.desc}</Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={24} color={meta.color} />
                )}
              </View>

              {/* Call type pill */}
              <View style={[styles.callPill, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                <MaterialCommunityIcons name={meta.callIcon} size={14} color={meta.callColor} />
                <Text style={[styles.callPillText, { color: meta.callColor }]}>{meta.callLabel}</Text>
                {isPremium && (
                  <View style={styles.videoBadge}>
                    <MaterialCommunityIcons name="phone" size={12} color={meta.callColor} />
                  </View>
                )}
              </View>

              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: meta.color }]}>{formatCurrency(plan.price)}</Text>
                {plan.originalPrice > plan.price && (
                  <Text style={styles.originalPrice}>{formatCurrency(plan.originalPrice)}</Text>
                )}
                <Text style={styles.period}>/ {billing === 'yearly' ? 'year' : 'month'}</Text>
              </View>

              <View style={styles.featureList}>
                {features.map((f: string, i: number) => (
                  <View key={i} style={styles.featureRow}>
                    <MaterialCommunityIcons name="check-circle" size={15} color={Colors.success} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              {isActive ? (
                <Button
                  mode="outlined"
                  onPress={() => router.push('/(patient)/subscription/active')}
                  style={[styles.planBtn, { borderColor: Colors.success }]}
                  textColor={Colors.success}
                  compact
                >
                  Manage Plan
                </Button>
              ) : (
                <Button
                  mode={isSelected ? 'contained' : plan.isPopular ? 'contained' : 'outlined'}
                  onPress={() => setSelectedPlanId(isSelected ? null : String(plan.id))}
                  style={styles.planBtn}
                  buttonColor={isSelected ? meta.color : plan.isPopular ? meta.color : undefined}
                  textColor={isSelected || plan.isPopular ? Colors.white : meta.color}
                  contentStyle={styles.planBtnContent}
                  compact
                  icon={isSelected ? 'check' : undefined}
                >
                  {isSelected ? 'Selected' : isPremium ? 'Select Video Plan' : 'Select Voice Plan'}
                </Button>
              )}
            </TouchableOpacity>
          );
        })}

        {sorted.length === 0 && (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="star-outline" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No plans available</Text>
          </View>
        )}

        {/* Feature comparison table */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Plan Comparison</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, styles.tableFeatureCol]} />
            <View style={[styles.tableColHeader, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="phone" size={14} color="#3B82F6" />
              <Text style={[styles.tableColHeaderText, { color: '#3B82F6' }]}>Voice</Text>
            </View>
            <View style={[styles.tableColHeader, { backgroundColor: '#F5F3FF' }]}>
              <MaterialCommunityIcons name="video" size={14} color="#8B5CF6" />
              <Text style={[styles.tableColHeaderText, { color: '#8B5CF6' }]}>Video</Text>
            </View>
          </View>
          {[
            { label: 'Voice Calls', base: true, premium: true },
            { label: 'HD Video Calls', base: false, premium: true },
            { label: 'Prescriptions', base: true, premium: true },
            { label: 'Health Records', base: true, premium: true },
            { label: 'Priority Support', base: false, premium: true },
          ].map((row, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
              <Text style={[styles.tableCol, styles.tableFeatureCol]}>{row.label}</Text>
              <View style={styles.tableCol}>
                <MaterialCommunityIcons
                  name={row.base ? 'check-circle' : 'close-circle'}
                  size={18}
                  color={row.base ? Colors.success : Colors.textTertiary}
                />
              </View>
              <View style={styles.tableCol}>
                <MaterialCommunityIcons
                  name={row.premium ? 'check-circle' : 'close-circle'}
                  size={18}
                  color={row.premium ? Colors.success : Colors.textTertiary}
                />
              </View>
            </View>
          ))}
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <View style={{ height: selectedPlan ? insets.bottom + 140 : 24 }} />
      </ScrollView>

      {/* Purchase Now bottom bar */}
      {selectedPlan && (() => {
        const meta = TIER_META[selectedPlan.tier as keyof typeof TIER_META] || TIER_META.BASE;
        return (
          <View style={[styles.purchaseBar, { bottom: insets.bottom + 62, paddingBottom: 16 }]}>
            <View style={styles.purchaseBarInfo}>
              <Text style={styles.purchaseBarName}>{selectedPlan.name}</Text>
              <Text style={[styles.purchaseBarPrice, { color: meta.color }]}>
                {formatCurrency(selectedPlan.price)}
                <Text style={styles.purchaseBarPeriod}> / {billing === 'yearly' ? 'yr' : 'mo'}</Text>
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={handlePurchaseNow}
              loading={purchasing}
              disabled={purchasing}
              style={[styles.purchaseBtn, { backgroundColor: meta.color }]}
              contentStyle={styles.purchaseBtnContent}
              labelStyle={styles.purchaseBtnLabel}
              icon={purchasing ? undefined : 'lock'}
            >
              {purchasing ? 'Processing…' : 'Purchase Now'}
            </Button>
          </View>
        );
      })()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FB' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  hero: { alignItems: 'center', paddingVertical: 20 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  heroSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  activeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.successLight, borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.success + '40',
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.success },
  activeBannerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  compareRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginBottom: 20,
  },
  compareChip: {
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5, gap: 4,
  },
  compareChipText: { fontSize: 13, fontWeight: '700' },
  compareChipSub: { fontSize: 11, color: Colors.textSecondary },

  billingToggle: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 14,
    padding: 4, marginBottom: 16, alignSelf: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  billingBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 11,
  },
  billingBtnActive: { backgroundColor: Colors.primary },
  billingBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  billingBtnTextActive: { color: Colors.white },
  saveBadge: {
    backgroundColor: Colors.success + '20', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  saveBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.success },

  planCard: {
    backgroundColor: Colors.white, borderRadius: 20, marginBottom: 16,
    padding: 18, borderWidth: 1.5,
  },
  planCardHighlighted: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  planBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 6, marginBottom: 10,
  },
  planBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.white, letterSpacing: 0.8 },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  planIconBox: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  planTitleBlock: { flex: 1 },
  planName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  planCallType: { fontSize: 12, marginTop: 2 },

  callPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 12,
  },
  callPillText: { fontSize: 12, fontWeight: '700' },
  videoBadge: { marginLeft: 2 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 },
  price: { fontSize: 26, fontWeight: '800' },
  originalPrice: { fontSize: 14, color: Colors.textTertiary, textDecorationLine: 'line-through' },
  period: { fontSize: 13, color: Colors.textSecondary },

  featureList: { gap: 7, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },

  planBtn: { borderRadius: 12 },
  planBtnContent: { paddingVertical: 4 },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textTertiary },

  purchaseBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
    zIndex: 20,
  },
  purchaseBarInfo: { flex: 1, marginRight: 12 },
  purchaseBarName: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  purchaseBarPrice: { fontSize: 20, fontWeight: '800' },
  purchaseBarPeriod: { fontSize: 13, fontWeight: '400', color: Colors.textSecondary },
  purchaseBtn: { borderRadius: 14 },
  purchaseBtnContent: { paddingVertical: 6, paddingHorizontal: 8 },
  purchaseBtnLabel: { fontSize: 15, fontWeight: '700' },
  errorText: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    fontWeight: '600',
  },

  tableCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginTop: 8,
  },
  tableTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  tableHeader: { flexDirection: 'row', marginBottom: 4 },
  tableColHeader: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 6, borderRadius: 8, marginHorizontal: 2,
  },
  tableColHeaderText: { fontSize: 12, fontWeight: '700' },
  tableRow: { flexDirection: 'row', paddingVertical: 10 },
  tableRowAlt: { backgroundColor: '#F8FAFC', borderRadius: 8 },
  tableCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tableFeatureCol: { flex: 2, alignItems: 'flex-start', paddingLeft: 8 },
});
