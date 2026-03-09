import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Appointment, TimeSlot } from '../types';

interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
  availableSlots: TimeSlot[];
  filter: 'upcoming' | 'past' | 'cancelled';
  isBooking: boolean;
  bookingStep: 'doctor' | 'slot' | 'confirm' | 'payment';
  selectedDoctorId: string | null;
  symptoms: string;
}

const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  selectedDate: null,
  selectedSlot: null,
  availableSlots: [],
  filter: 'upcoming',
  isBooking: false,
  bookingStep: 'doctor',
  selectedDoctorId: null,
  symptoms: '',
};

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setAppointments(state, action: PayloadAction<Appointment[]>) { state.appointments = action.payload; },
    setSelectedAppointment(state, action: PayloadAction<Appointment | null>) { state.selectedAppointment = action.payload; },
    setSelectedDate(state, action: PayloadAction<string | null>) { state.selectedDate = action.payload; },
    setSelectedSlot(state, action: PayloadAction<TimeSlot | null>) { state.selectedSlot = action.payload; },
    setAvailableSlots(state, action: PayloadAction<TimeSlot[]>) { state.availableSlots = action.payload; },
    setFilter(state, action: PayloadAction<'upcoming' | 'past' | 'cancelled'>) { state.filter = action.payload; },
    setBookingStep(state, action: PayloadAction<AppointmentState['bookingStep']>) { state.bookingStep = action.payload; },
    setSelectedDoctorId(state, action: PayloadAction<string | null>) { state.selectedDoctorId = action.payload; },
    setSymptoms(state, action: PayloadAction<string>) { state.symptoms = action.payload; },
    resetBooking(state) {
      state.selectedDate = null; state.selectedSlot = null;
      state.bookingStep = 'doctor'; state.selectedDoctorId = null;
      state.symptoms = ''; state.isBooking = false;
    },
  },
});

export const {
  setAppointments, setSelectedAppointment, setSelectedDate,
  setSelectedSlot, setAvailableSlots, setFilter,
  setBookingStep, setSelectedDoctorId, setSymptoms, resetBooking,
} = appointmentSlice.actions;
export default appointmentSlice.reducer;
