import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Prescription, Medicine } from '../types';

interface PrescriptionState {
  prescriptions: Prescription[];
  selectedPrescription: Prescription | null;
  draftMedicines: Medicine[];
  draftDiagnosis: string;
  draftNotes: string;
  searchQuery: string;
}

const initialState: PrescriptionState = {
  prescriptions: [], selectedPrescription: null,
  draftMedicines: [], draftDiagnosis: '', draftNotes: '', searchQuery: '',
};

const prescriptionSlice = createSlice({
  name: 'prescriptions',
  initialState,
  reducers: {
    setPrescriptions(state, action: PayloadAction<Prescription[]>) { state.prescriptions = action.payload; },
    setSelectedPrescription(state, action: PayloadAction<Prescription | null>) { state.selectedPrescription = action.payload; },
    addDraftMedicine(state, action: PayloadAction<Medicine>) { state.draftMedicines.push(action.payload); },
    removeDraftMedicine(state, action: PayloadAction<string>) { state.draftMedicines = state.draftMedicines.filter((m) => m.id !== action.payload); },
    updateDraftMedicine(state, action: PayloadAction<Medicine>) {
      const idx = state.draftMedicines.findIndex((m) => m.id === action.payload.id);
      if (idx !== -1) state.draftMedicines[idx] = action.payload;
    },
    setDraftDiagnosis(state, action: PayloadAction<string>) { state.draftDiagnosis = action.payload; },
    setDraftNotes(state, action: PayloadAction<string>) { state.draftNotes = action.payload; },
    setSearchQuery(state, action: PayloadAction<string>) { state.searchQuery = action.payload; },
    resetDraft(state) { state.draftMedicines = []; state.draftDiagnosis = ''; state.draftNotes = ''; },
  },
});

export const {
  setPrescriptions, setSelectedPrescription, addDraftMedicine,
  removeDraftMedicine, updateDraftMedicine, setDraftDiagnosis,
  setDraftNotes, setSearchQuery, resetDraft,
} = prescriptionSlice.actions;
export default prescriptionSlice.reducer;
