import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_PREFIX = '__tc_';

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    const prefixed = STORAGE_PREFIX + key;
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(prefixed, value);
      } else {
        await SecureStore.setItemAsync(prefixed, value);
      }
    } catch {
      await AsyncStorage.setItem(prefixed, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    const prefixed = STORAGE_PREFIX + key;
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(prefixed);
      }
      return await SecureStore.getItemAsync(prefixed);
    } catch {
      return await AsyncStorage.getItem(prefixed);
    }
  },

  async removeItem(key: string): Promise<void> {
    const prefixed = STORAGE_PREFIX + key;
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(prefixed);
      } else {
        await SecureStore.deleteItemAsync(prefixed);
      }
    } catch {
      await AsyncStorage.removeItem(prefixed);
    }
  },

  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(STORAGE_PREFIX)) keysToRemove.push(key);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } else {
        const allKeys = await AsyncStorage.getAllKeys();
        const tcKeys = allKeys.filter((k) => k.startsWith(STORAGE_PREFIX));
        await AsyncStorage.multiRemove(tcKeys);
      }
    } catch { /* ignore */ }
  },
};
