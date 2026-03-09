import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { apiSlice } from './apiSlice';
import authReducer from '../slices/authSlice';
import appointmentReducer from '../slices/appointmentSlice';
import subscriptionReducer from '../slices/subscriptionSlice';
import prescriptionReducer from '../slices/prescriptionSlice';
import notificationReducer from '../slices/notificationSlice';
import profileReducer from '../slices/profileSlice';
import videoReducer from '../slices/videoSlice';
import doctorReducer from '../slices/doctorSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    appointments: appointmentReducer,
    subscription: subscriptionReducer,
    prescriptions: prescriptionReducer,
    notifications: notificationReducer,
    profile: profileReducer,
    video: videoReducer,
    doctor: doctorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['video/setLocalStream', 'video/setRemoteStream'],
      },
    }).concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
