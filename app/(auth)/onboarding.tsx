import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
  Animated,
} from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppDispatch } from '../../src/store';
import { setFirstLaunch } from '../../src/slices/authSlice';
import { Colors } from '../../src/theme';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}

const slides: Slide[] = [
  {
    id: '1',
    icon: 'video',
    title: 'Video Consultations',
    subtitle:
      'Connect with certified doctors through HD video calls from the comfort of your home',
    color: Colors.primary,
  },
  {
    id: '2',
    icon: 'file-document-outline',
    title: 'Digital Prescriptions',
    subtitle:
      'Receive e-prescriptions instantly after consultation. Download, share, and track your medications',
    color: Colors.secondary,
  },
  {
    id: '3',
    icon: 'shield-check',
    title: 'Secure & Private',
    subtitle:
      'Your health data is encrypted and protected with industry-standard security measures',
    color: Colors.accent,
  },
];

export default function OnboardingScreen() {
  const dispatch = useAppDispatch();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleGetStarted = () => {
    dispatch(setFirstLaunch(false));
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
        <MaterialCommunityIcons name={item.icon} size={64} color={item.color} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipRow}>
        <Button
          mode="text"
          onPress={handleGetStarted}
          textColor={Colors.textSecondary}
        >
          Skip
        </Button>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? { backgroundColor: slides[activeIndex].color, width: 24 }
                  : { backgroundColor: Colors.border },
              ]}
            />
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.nextButton}
          contentStyle={styles.nextButtonContent}
          buttonColor={slides[activeIndex].color}
          labelStyle={styles.nextButtonLabel}
        >
          {activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    borderRadius: 12,
  },
  nextButtonContent: {
    paddingVertical: 6,
  },
  nextButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
