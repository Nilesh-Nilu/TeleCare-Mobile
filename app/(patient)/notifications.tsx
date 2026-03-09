import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGetMyNotificationsQuery } from '../../src/store/apiSlice';
import { AppHeader, EmptyState, LoadingScreen } from '../../src/components';
import { formatRelativeTime } from '../../src/utils/formatters';
import { Colors } from '../../src/theme';
import type { Notification } from '../../src/types';

const typeIcons: Record<string, { icon: string; color: string }> = {
  appointment_reminder: { icon: 'calendar-clock', color: Colors.info },
  appointment_confirmed: { icon: 'calendar-check', color: Colors.success },
  appointment_cancelled: { icon: 'calendar-remove', color: Colors.error },
  prescription_ready: { icon: 'file-document-check', color: Colors.accent },
  payment_success: { icon: 'check-circle', color: Colors.success },
  subscription_expiring: { icon: 'alert-circle', color: Colors.warning },
  general: { icon: 'bell-outline', color: Colors.primary },
};

export default function NotificationCenterScreen() {
  const { data, isLoading, refetch } = useGetMyNotificationsQuery(undefined);
  const notifications: Notification[] = data?.data || [];

  if (isLoading && notifications.length === 0) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Notifications" showBack />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        renderItem={({ item }) => {
          const typeInfo = typeIcons[item.type] || typeIcons.general;
          return (
            <Card style={[styles.card, !item.isRead && styles.unreadCard]}>
              <Card.Content style={styles.cardContent}>
                <View style={[styles.iconBox, { backgroundColor: typeInfo.color + '15' }]}>
                  <MaterialCommunityIcons
                    name={typeInfo.icon as any}
                    size={22}
                    color={typeInfo.color}
                  />
                </View>
                <View style={styles.info}>
                  <Text variant="titleSmall" style={styles.title}>{item.title}</Text>
                  <Text variant="bodySmall" style={styles.message} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text variant="labelSmall" style={styles.time}>
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="bell-off-outline"
            title="No notifications"
            subtitle="You're all caught up!"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 10 },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  info: { flex: 1 },
  title: { fontWeight: '600', color: Colors.textPrimary },
  message: { color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  time: { color: Colors.textTertiary, marginTop: 6 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6,
  },
});
