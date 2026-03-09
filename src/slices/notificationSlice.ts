import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  filter: 'all' | 'unread' | 'appointments' | 'payments' | 'general';
}

const initialState: NotificationState = { notifications: [], unreadCount: 0, filter: 'all' };

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) state.unreadCount++;
    },
    markRead(state, action: PayloadAction<string>) {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n && !n.isRead) { n.isRead = true; state.unreadCount--; }
    },
    markAllRead(state) { state.notifications.forEach((n) => (n.isRead = true)); state.unreadCount = 0; },
    setFilter(state, action: PayloadAction<NotificationState['filter']>) { state.filter = action.payload; },
  },
});

export const { setNotifications, addNotification, markRead, markAllRead, setFilter } = notificationSlice.actions;
export default notificationSlice.reducer;
