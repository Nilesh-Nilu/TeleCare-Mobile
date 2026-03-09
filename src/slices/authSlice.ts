import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../utils/secureStorage';
import { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLaunch: boolean;
  isHydrated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  isFirstLaunch: true,
  isHydrated: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth(state, action: PayloadAction<{ user: User | null; tokens: AuthTokens | null; onboarded: boolean }>) {
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.isAuthenticated = !!action.payload.tokens?.accessToken;
      state.isFirstLaunch = !action.payload.onboarded;
      state.isLoading = false;
      state.isHydrated = true;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      AsyncStorage.setItem('user', JSON.stringify(action.payload));
    },
    setTokens(state, action: PayloadAction<AuthTokens>) {
      state.tokens = action.payload;
      AsyncStorage.setItem('accessToken', action.payload.accessToken);
      AsyncStorage.setItem('refreshToken', action.payload.refreshToken);
      secureStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setFirstLaunch(state, action: PayloadAction<boolean>) {
      state.isFirstLaunch = action.payload;
      if (!action.payload) AsyncStorage.setItem('onboarded', 'true');
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
      secureStorage.removeItem('refreshToken');
      secureStorage.removeItem('accessToken');
    },
  },
});

export const { hydrateAuth, setUser, setTokens, setLoading, setFirstLaunch, setError, logout } = authSlice.actions;
export default authSlice.reducer;
