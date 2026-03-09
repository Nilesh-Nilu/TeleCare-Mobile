import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Patient, Doctor } from '../types';

interface ProfileState {
  profile: Patient | Doctor | null;
  preferences: {
    notificationsEnabled: boolean;
    appointmentReminders: boolean;
    medicineReminders: boolean;
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
}

const initialState: ProfileState = {
  profile: null,
  preferences: {
    notificationsEnabled: true, appointmentReminders: true,
    medicineReminders: true, language: 'en', theme: 'system',
  },
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<Patient | Doctor>) { state.profile = action.payload; },
    updatePreferences(state, action: PayloadAction<Partial<ProfileState['preferences']>>) {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    clearProfile(state) { state.profile = null; },
  },
});

export const { setProfile, updatePreferences, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
