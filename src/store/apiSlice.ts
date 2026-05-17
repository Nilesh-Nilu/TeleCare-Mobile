import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken } from '../services/api';

const BASE_URL = String(process.env.EXPO_PUBLIC_API_URL || '').trim() || '/api';

const normalizePlan = (plan: any) => {
  const name = String(plan?.name || 'Plan');
  const isPremium = name.toLowerCase().includes('premium');
  const durationMonths = Number(plan?.durationMonths ?? 1);
  const type = durationMonths >= 12 ? 'yearly' : 'monthly';
  const maxConsultations = Number(plan?.consultationLimit ?? 0);
  return {
    id: String(plan?.id ?? ''),
    name,
    type,
    tier: isPremium ? 'PREMIUM' : 'BASE',
    price: Number(plan?.price ?? 0),
    originalPrice: Number(plan?.price ?? 0),
    features: isPremium
      ? [
          `${maxConsultations} consultations`,
          'Video + voice consultations',
          'Priority support',
        ]
      : [
          `${maxConsultations} consultations`,
          'Voice consultations',
          'Digital prescriptions',
        ],
    maxConsultations,
    isPopular: false,
  };
};

const normalizeSubscriptionStatus = (sub: any) => {
  if (!sub) return sub;
  const normalizedPlan = normalizePlan(sub.plan);
  const maxConsultations = Number(normalizedPlan.maxConsultations || 0);
  const remainingConsultations = Number(sub.remainingConsultations || 0);
  return {
    ...sub,
    id: String(sub.id ?? ''),
    planId: String(sub.planId ?? normalizedPlan.id),
    plan: normalizedPlan,
    autoRenew: false,
    consultationsUsed: Math.max(0, maxConsultations - remainingConsultations),
  };
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = getAccessToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    'Appointments', 'Doctors', 'Prescriptions', 'Notifications',
    'Profile', 'Subscription', 'Slots', 'Records', 'Earnings', 'Video', 'Payments',
  ],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials: { email: string; password: string }) => ({
        url: '/auth/login', method: 'POST', body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData: { role: string; name: string; email: string; password: string; phone?: string }) => ({
        url: '/auth/register', method: 'POST', body: userData,
      }),
    }),
    refreshToken: builder.mutation({
      query: (data: { refreshToken: string }) => ({ url: '/auth/refresh', method: 'POST', body: data }),
    }),
    logoutUser: builder.mutation({ query: () => ({ url: '/auth/logout', method: 'POST' }) }),
    getAuthMe: builder.query({ query: () => '/auth/me' }),

    getProfile: builder.query({ query: () => '/users/me', providesTags: ['Profile'] }),
    getUsers: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({ url: '/users', params }),
    }),

    getDoctors: builder.query({
      query: (params?: { search?: string; specialty?: string; page?: number; limit?: number }) => ({
        url: '/doctors', params,
      }),
      providesTags: ['Doctors'],
    }),
    getDoctorById: builder.query({
      query: (id: number) => `/doctors/${id}`,
      providesTags: ['Doctors'],
    }),
    getDoctorSchedule: builder.query({
      query: (doctorId: number) => `/doctors/${doctorId}/schedule`,
      providesTags: ['Slots'],
    }),
    updateMyDaySchedule: builder.mutation({
      query: ({
        dayOfWeek,
        ...data
      }: {
        dayOfWeek: number;
        isActive?: boolean;
        startTime?: string;
        endTime?: string;
        slotDuration?: number;
        breaks?: { startTime: string; endTime: string }[];
      }) => ({
        url: `/doctors/me/schedule/${dayOfWeek}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Slots', 'Doctors'],
    }),

    getPlans: builder.query({
      query: () => '/subscription/plans',
      transformResponse: (response: any) => ({
        ...response,
        data: Array.isArray(response?.data) ? response.data.map(normalizePlan) : [],
      }),
      providesTags: ['Subscription'],
    }),
    subscribePlan: builder.mutation({
      query: (data: { planId: number }) => ({ url: '/subscription/subscribe', method: 'POST', body: data }),
      invalidatesTags: ['Subscription'],
    }),
    getSubscriptionStatus: builder.query({
      query: () => '/subscription/status',
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeSubscriptionStatus(response?.data),
      }),
      providesTags: ['Subscription'],
    }),
    renewSubscription: builder.mutation({
      query: (data: { subscriptionId: number }) => ({ url: '/subscription/renew', method: 'POST', body: data }),
      invalidatesTags: ['Subscription'],
    }),

    getMyAppointments: builder.query({
      query: (params?: { status?: string; page?: number; limit?: number }) => ({
        url: '/appointments/my', params,
      }),
      providesTags: ['Appointments'],
    }),
    getAppointmentById: builder.query({
      query: (id: number) => `/appointments/${id}`,
      providesTags: ['Appointments'],
    }),
    getDoctorQueue: builder.query({
      query: (params?: { date?: string }) => ({ url: '/appointments/doctor/queue', params }),
      providesTags: ['Appointments'],
    }),
    getBookedSlots: builder.query({
      query: ({ doctorId, date }: { doctorId: number; date?: string }) => ({
        url: '/appointments/slots', params: { doctor_id: doctorId, ...(date ? { date } : {}) },
      }),
      providesTags: ['Slots'],
    }),
    bookAppointment: builder.mutation({
      query: (data: {
        doctorId: number;
        appointmentDate: string;
        startTime: string;
        endTime: string;
        callType?: 'VOICE' | 'VIDEO';
      }) => ({
        url: '/appointments/book', method: 'POST', body: data,
      }),
      invalidatesTags: ['Appointments', 'Slots'],
    }),
    rescheduleAppointment: builder.mutation({
      query: ({ id, ...data }: { id: number; appointmentDate: string; startTime: string; endTime: string }) => ({
        url: `/appointments/${id}/reschedule`, method: 'PUT', body: data,
      }),
      invalidatesTags: ['Appointments', 'Slots'],
    }),
    cancelAppointment: builder.mutation({
      query: (id: number) => ({ url: `/appointments/${id}/cancel`, method: 'DELETE' }),
      invalidatesTags: ['Appointments'],
    }),
    updateAppointmentStatus: builder.mutation({
      query: ({ id, status }: { id: number; status: string }) => ({
        url: `/appointments/${id}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Appointments'],
    }),

    createVideoSession: builder.mutation({
      query: (data: { appointmentId: number; callType?: 'VOICE' | 'VIDEO' }) => ({
        url: '/video/create-session', method: 'POST', body: data,
      }),
      invalidatesTags: ['Video'],
    }),
    getVideoToken: builder.query({
      query: (appointmentId: number) => `/video/token/${appointmentId}`,
      providesTags: ['Video'],
    }),
    getCallType: builder.query({
      query: () => '/video/call-type',
      providesTags: ['Video', 'Subscription'],
    }),
    endVideoSession: builder.mutation({
      query: (data: { sessionId: string }) => ({ url: '/video/end-session', method: 'POST', body: data }),
      invalidatesTags: ['Video'],
    }),

    createPrescription: builder.mutation({
      query: (data: {
        consultationId?: number;
        appointmentId?: number;
        doctorId?: number;
        patientId: number;
        diagnosis: string;
        medicines: { name: string; dose: string; duration: string }[];
        advice: string;
        imageBase64?: string;
      }) => ({ url: '/prescriptions', method: 'POST', body: data }),
      invalidatesTags: ['Prescriptions'],
    }),
    getPrescriptionById: builder.query({
      query: (id: number) => `/prescriptions/${id}`,
      providesTags: ['Prescriptions'],
    }),
    getMyPrescriptions: builder.query({
      query: () => '/prescriptions/my',
      providesTags: ['Prescriptions'],
    }),
    getPatientPrescriptions: builder.query({
      query: (patientId: number) => `/prescriptions/patient/${patientId}`,
      providesTags: ['Prescriptions'],
    }),

    getMedicalRecords: builder.query({
      query: (params?: { type?: string }) => ({ url: '/records/medical', params }),
      providesTags: ['Records'],
    }),
    getHealthVitals: builder.query({
      query: (params?: { type?: string }) => ({ url: '/records/vitals', params }),
      providesTags: ['Records'],
    }),
    addHealthVital: builder.mutation({
      query: (data: { type: string; value: string; unit: string }) => ({
        url: '/records/vitals', method: 'POST', body: data,
      }),
      invalidatesTags: ['Records'],
    }),
    getPatientRecords: builder.query({
      query: (patientId: number) => `/records/patient/${patientId}`,
      providesTags: ['Records'],
    }),

    getDoctorEarnings: builder.query({
      query: (params?: { period?: string }) => ({ url: '/earnings', params }),
      providesTags: ['Earnings'],
    }),
    getDoctorDashboard: builder.query({
      query: () => '/doctors/dashboard',
      providesTags: ['Appointments', 'Earnings'],
    }),

    initiatePayment: builder.mutation({
      query: (data: { subscriptionId: number; amount: number; gateway: string }) => ({
        url: '/payment/initiate', method: 'POST', body: data,
      }),
      invalidatesTags: ['Payments'],
    }),
    getPaymentHistory: builder.query({
      query: () => '/payment/history',
      transformResponse: (response: any) => ({
        ...response,
        data: Array.isArray(response?.data)
          ? response.data.map((item: any) => ({
              ...item,
              id: String(item?.id ?? ''),
              amount: Number(item?.amount ?? 0),
              type: 'subscription',
              currency: 'INR',
            }))
          : [],
      }),
      providesTags: ['Payments'],
    }),

    createNotification: builder.mutation({
      query: (data: { userId: number; title: string; body: string }) => ({
        url: '/notifications', method: 'POST', body: data,
      }),
      invalidatesTags: ['Notifications'],
    }),
    getMyNotifications: builder.query({
      query: () => '/notifications/my',
      transformResponse: (response: any) => ({
        ...response,
        data: Array.isArray(response?.data)
          ? response.data.map((item: any) => ({
              ...item,
              id: String(item?.id ?? ''),
              userId: String(item?.userId ?? ''),
              type: 'general',
              message: item?.body || '',
              isRead: false,
              createdAt: item?.sentAt || new Date().toISOString(),
            }))
          : [],
      }),
      providesTags: ['Notifications'],
    }),
  }),
});

export const {
  useLoginMutation, useRegisterMutation, useRefreshTokenMutation,
  useLogoutUserMutation, useGetAuthMeQuery,
  useGetProfileQuery, useGetUsersQuery,
  useGetDoctorsQuery, useGetDoctorByIdQuery, useGetDoctorScheduleQuery,
  useUpdateMyDayScheduleMutation,
  useGetPlansQuery, useSubscribePlanMutation, useGetSubscriptionStatusQuery, useRenewSubscriptionMutation,
  useGetMyAppointmentsQuery, useGetAppointmentByIdQuery, useGetDoctorQueueQuery,
  useGetBookedSlotsQuery, useBookAppointmentMutation, useRescheduleAppointmentMutation, useCancelAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useCreateVideoSessionMutation, useGetVideoTokenQuery, useGetCallTypeQuery, useEndVideoSessionMutation,
  useCreatePrescriptionMutation, useGetPrescriptionByIdQuery, useGetMyPrescriptionsQuery, useGetPatientPrescriptionsQuery,
  useGetMedicalRecordsQuery, useGetHealthVitalsQuery, useAddHealthVitalMutation, useGetPatientRecordsQuery,
  useGetDoctorEarningsQuery, useGetDoctorDashboardQuery,
  useInitiatePaymentMutation, useGetPaymentHistoryQuery,
  useCreateNotificationMutation, useGetMyNotificationsQuery,
} = apiSlice;
