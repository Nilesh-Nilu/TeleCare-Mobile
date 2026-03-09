import { ColorValue, ViewStyle } from 'react-native';

const shadowBase = (opacity: number, radius: number, height: number): ViewStyle => ({
  shadowColor: '#000000' as ColorValue,
  shadowOffset: { width: 0, height },
  shadowOpacity: opacity,
  shadowRadius: radius,
});

export const Shadows = {
  sm: {
    ...shadowBase(0.08, 2, 1),
    elevation: 1,
  } satisfies ViewStyle,
  md: {
    ...shadowBase(0.1, 4, 2),
    elevation: 2,
  } satisfies ViewStyle,
  lg: {
    ...shadowBase(0.12, 8, 4),
    elevation: 4,
  } satisfies ViewStyle,
} as const;
