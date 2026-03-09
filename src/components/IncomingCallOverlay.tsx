import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIncomingCall } from '../hooks/useIncomingCall';
import { Avatar } from './Avatar';
import { Colors } from '../theme';

export function IncomingCallOverlay() {
  const { incomingCall, accept, decline } = useIncomingCall();
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (incomingCall) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [incomingCall, slideAnim, pulseAnim]);

  const isVideo = incomingCall?.callType === 'VIDEO';

  return (
    <Modal
      visible={!!incomingCall}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={decline}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.6)" translucent />
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.backdrop}>
          <View style={styles.content}>
            <View style={styles.callerRow}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={[styles.avatarRing, isVideo && styles.avatarRingVideo]}>
                  <Avatar name={incomingCall?.callerName ?? ''} size={56} uri={incomingCall?.callerAvatar} />
                </View>
              </Animated.View>

              <View style={styles.callerInfo}>
                <Text style={styles.callerLabel}>Incoming {isVideo ? 'Video' : 'Voice'} Call</Text>
                <Text style={styles.callerName} numberOfLines={1}>{incomingCall?.callerName}</Text>
              </View>

              <MaterialCommunityIcons
                name={isVideo ? 'video' : 'phone'}
                size={24}
                color={isVideo ? '#8B5CF6' : '#3B82F6'}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.declineBtn]}
                onPress={decline}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="phone-hangup" size={22} color={Colors.white} />
                <Text style={styles.actionLabel}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn, isVideo && styles.acceptBtnVideo]}
                onPress={accept}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isVideo ? 'video' : 'phone'}
                  size={22}
                  color={Colors.white}
                />
                <Text style={styles.actionLabel}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  callerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingVideo: {
    borderColor: '#8B5CF6',
  },
  callerInfo: {
    flex: 1,
  },
  callerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  callerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  declineBtn: {
    backgroundColor: Colors.error,
  },
  acceptBtn: {
    backgroundColor: '#22C55E',
  },
  acceptBtnVideo: {
    backgroundColor: '#8B5CF6',
  },
  actionLabel: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
