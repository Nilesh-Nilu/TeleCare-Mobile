export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isOnline?: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: { name: string; phone: string; relation: string };
  subscriptionId?: string;
}

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
  qualifications: string[];
  experience: number;
  languages: string[];
  consultationFee: number;
  bio?: string;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  registrationNumber: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  dateOfBirth?: string;
  gender?: string;
}

export type PlanType = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionTier = 'BASE' | 'PREMIUM';
export type CallType = 'VOICE' | 'VIDEO';

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: PlanType;
  tier: SubscriptionTier;
  price: number;
  originalPrice: number;
  features: string[];
  maxConsultations: number;
  isPopular: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  consultationsUsed: number;
}

export type AppointmentStatus =
  | 'scheduled' | 'confirmed' | 'in_progress'
  | 'completed' | 'cancelled' | 'no_show';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patient?: Patient;
  doctor?: Doctor;
  date?: string;
  startTime?: string;
  endTime?: string;
  status: AppointmentStatus;
  type: 'video' | 'audio' | 'chat';
  symptoms?: string;
  notes?: string;
  fee: number;
  paymentId?: string;
  prescriptionId?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  beforeFood: boolean;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  doctor?: Doctor;
  patient?: Patient;
  diagnosis: string;
  medicines: Medicine[];
  notes?: string;
  followUpDate?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  type: 'consultation' | 'report' | 'lab_result' | 'imaging';
  title: string;
  description?: string;
  fileUrl?: string;
  appointmentId?: string;
  doctor?: Doctor;
  date: string;
  createdAt: string;
}

export interface HealthVital {
  id: string;
  patientId: string;
  type: 'blood_pressure' | 'blood_sugar' | 'weight' | 'temperature' | 'heart_rate';
  value: string;
  unit: string;
  recordedAt: string;
}

export type NotificationType =
  | 'appointment_reminder' | 'appointment_confirmed' | 'appointment_cancelled'
  | 'prescription_ready' | 'payment_success' | 'subscription_expiring' | 'general';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IncomingCall {
  appointmentId: string;
  callerName: string;
  callerAvatar?: string;
  callerId: string;
  callType: CallType;
  channelName: string;
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: 'consultation' | 'subscription';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  invoiceUrl?: string;
  createdAt: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  breaks?: { startTime: string; endTime: string }[];
}

export interface DoctorEarnings {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayout: number;
  totalConsultations: number;
  monthlyConsultations: number;
  transactions: Payment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
