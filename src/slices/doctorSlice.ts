import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DoctorSchedule, DoctorEarnings, Appointment } from '../types';

interface DoctorState {
  schedule: DoctorSchedule[];
  earnings: DoctorEarnings | null;
  patientQueue: Appointment[];
  todayStats: { consultations: number; earnings: number; pendingPatients: number };
}

const initialState: DoctorState = {
  schedule: [], earnings: null, patientQueue: [],
  todayStats: { consultations: 0, earnings: 0, pendingPatients: 0 },
};

const doctorSlice = createSlice({
  name: 'doctor',
  initialState,
  reducers: {
    setSchedule(state, action: PayloadAction<DoctorSchedule[]>) { state.schedule = action.payload; },
    setEarnings(state, action: PayloadAction<DoctorEarnings>) { state.earnings = action.payload; },
    setPatientQueue(state, action: PayloadAction<Appointment[]>) { state.patientQueue = action.payload; },
    setTodayStats(state, action: PayloadAction<DoctorState['todayStats']>) { state.todayStats = action.payload; },
  },
});

export const { setSchedule, setEarnings, setPatientQueue, setTodayStats } = doctorSlice.actions;
export default doctorSlice.reducer;
