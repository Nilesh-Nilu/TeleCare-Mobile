export const APP_NAME = 'TeleCare Pro';
export const APP_VERSION = '1.0.0';

export const API_TIMEOUT = 15000;
export const SLOT_POLL_INTERVAL = 30000;
export const VIDEO_CALL_JOIN_BEFORE = 5;

export const SPECIALTIES = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'ENT Specialist',
  'Gastroenterologist', 'Gynecologist', 'Neurologist', 'Ophthalmologist',
  'Orthopedist', 'Pediatrician', 'Psychiatrist', 'Pulmonologist', 'Urologist',
] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi',
  'Gujarati', 'Kannada', 'Malayalam', 'Odia', 'Punjabi', 'Urdu', 'Santali', 'Mundari',
] as const;

export const DOSAGE_FREQUENCIES = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed',
  'Before meals', 'After meals', 'At bedtime',
] as const;

export const MEDICINE_DURATIONS = [
  '3 days', '5 days', '7 days', '10 days', '14 days', '21 days',
  '30 days', '60 days', '90 days', 'Until next visit', 'As directed',
] as const;

export const APPOINTMENT_TYPES = {
  video: { label: 'Video Call', icon: 'video-outline' },
  audio: { label: 'Audio Call', icon: 'phone-outline' },
  chat: { label: 'Chat', icon: 'chat-outline' },
} as const;

export const STATUS_COLORS: Record<string, string> = {
  scheduled: '#3B82F6', confirmed: '#10B981', in_progress: '#F59E0B',
  booked: '#3B82F6', completed: '#6366F1', done: '#6366F1',
  cancelled: '#EF4444', missed: '#94A3B8', no_show: '#94A3B8',
  active: '#10B981', expired: '#EF4444', pending: '#F59E0B',
  success: '#10B981', failed: '#EF4444', refunded: '#8B5CF6', waiting: '#3B82F6',
};
