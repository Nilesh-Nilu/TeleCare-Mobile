import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Subscription, SubscriptionPlan } from '../types';

interface SubscriptionState {
  currentSubscription: Subscription | null;
  plans: SubscriptionPlan[];
  selectedPlan: SubscriptionPlan | null;
  isLoading: boolean;
}

const initialState: SubscriptionState = {
  currentSubscription: null, plans: [], selectedPlan: null, isLoading: false,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setCurrentSubscription(state, action: PayloadAction<Subscription | null>) { state.currentSubscription = action.payload; },
    setPlans(state, action: PayloadAction<SubscriptionPlan[]>) { state.plans = action.payload; },
    setSelectedPlan(state, action: PayloadAction<SubscriptionPlan | null>) { state.selectedPlan = action.payload; },
    setLoading(state, action: PayloadAction<boolean>) { state.isLoading = action.payload; },
  },
});

export const { setCurrentSubscription, setPlans, setSelectedPlan, setLoading } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
