import { Alert, Platform } from 'react-native';

/** Cross-platform simple info/error alert. */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Cross-platform confirmation dialog.
 * Uses window.confirm on web (Alert.alert is a no-op in browsers).
 */
export function confirmAlert(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmLabel = 'Confirm',
) {
  if (Platform.OS === 'web') {
    const msg = message ? `${title}\n\n${message}` : title;
    if (window.confirm(msg)) {
      onConfirm();
    } else {
      onCancel?.();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
