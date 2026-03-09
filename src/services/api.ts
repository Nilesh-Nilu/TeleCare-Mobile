import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../utils/secureStorage';
import type { ApiError } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://videoconsultapi.msidemopro.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let _onAuthFailure: (() => void) | null = null;

export const setOnAuthFailure = (cb: () => void) => {
  _onAuthFailure = cb;
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    secureStorage.setItem('accessToken', token);
  } else {
    secureStorage.removeItem('accessToken');
  }
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

export const loadAccessToken = async (): Promise<string | null> => {
  if (!accessToken) {
    accessToken = await secureStorage.getItem('accessToken');
  }
  return accessToken;
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // authSlice.setTokens saves to AsyncStorage (no prefix); secureStorage uses __tc_ prefix
        const refreshToken =
          (await AsyncStorage.getItem('refreshToken')) ||
          (await secureStorage.getItem('refreshToken'));
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken: newToken } = response.data.data;
        setAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        setAccessToken(null);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        await secureStorage.removeItem('accessToken');
        await secureStorage.removeItem('refreshToken');
        _onAuthFailure?.();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
