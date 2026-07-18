export interface EmployeeScheduleDay {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shiftId?: string | null;
  shift?: { id: string; name: string; code: string } | null;
}

export interface DayForm {
  enabled: boolean;
  id?: string;
  startTime: string;
  endTime: string;
  shiftId?: string;
}

/**
 * DayOfWeek mapping: 0=Monday … 6=Sunday (ISO 8601)
 * Compatible with the DayOfWeek enum on the backend.
 */
export const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
] as const;

/**
 * A schedule template entry defines working hours for a single day.
 */
export interface TemplateDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * A named weekly schedule template — predefined day-by-day working hours
 * for a particular specialty or clinic pattern.
 */
export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  specialization?: string; // Matches Doctor.specialization for auto-suggest
  days: TemplateDay[];
}

/**
 * Predefined weekly schedule templates, keyed by specialty.
 * Templates cover the most common OPD patterns in Indian clinics.
 */
export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'general-medicine',
    name: 'General Medicine',
    description: 'Standard OPD: Mon–Fri 9 AM – 5 PM',
    specialization: 'General Medicine',
    days: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    ],
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    description: 'Alternating days: MWF 10–4, TuTh 2–8 PM',
    specialization: 'Pediatrics',
    days: [
      { dayOfWeek: 0, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 1, startTime: '14:00', endTime: '20:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 3, startTime: '14:00', endTime: '20:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '16:00' },
    ],
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    description: 'Mon–Sat 8 AM – 2 PM (Sat till 12 PM)',
    specialization: 'Orthopedics',
    days: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '12:00' },
    ],
  },
  {
    id: 'gynecology',
    name: 'Gynecology',
    description: 'Mon–Fri 9 AM – 1 PM (morning OPD)',
    specialization: 'Gynecology',
    days: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '13:00' },
    ],
  },
  {
    id: 'cardiology',
    name: 'Cardiology',
    description: 'Alternating: MWF 8–12, TuTh 3–7 PM',
    specialization: 'Cardiology',
    days: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 1, startTime: '15:00', endTime: '19:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 3, startTime: '15:00', endTime: '19:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '12:00' },
    ],
  },
  {
    id: 'surgery',
    name: 'Surgery',
    description: 'Early OR schedule: Mon–Sat 7 AM – 3 PM',
    specialization: 'Surgery',
    days: [
      { dayOfWeek: 0, startTime: '07:00', endTime: '15:00' },
      { dayOfWeek: 1, startTime: '07:00', endTime: '15:00' },
      { dayOfWeek: 2, startTime: '07:00', endTime: '15:00' },
      { dayOfWeek: 3, startTime: '07:00', endTime: '15:00' },
      { dayOfWeek: 4, startTime: '07:00', endTime: '15:00' },
      { dayOfWeek: 5, startTime: '07:00', endTime: '15:00' },
    ],
  },
  {
    id: 'morning-opd',
    name: 'Morning OPD',
    description: 'Mon–Sat 8 AM – 2 PM',
    days: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '14:00' },
    ],
  },
  {
    id: 'evening-opd',
    name: 'Evening OPD',
    description: 'Mon–Fri 4 PM – 9 PM',
    days: [
      { dayOfWeek: 0, startTime: '16:00', endTime: '21:00' },
      { dayOfWeek: 1, startTime: '16:00', endTime: '21:00' },
      { dayOfWeek: 2, startTime: '16:00', endTime: '21:00' },
      { dayOfWeek: 3, startTime: '16:00', endTime: '21:00' },
      { dayOfWeek: 4, startTime: '16:00', endTime: '21:00' },
    ],
  },
  {
    id: 'full-week',
    name: 'Full Week',
    description: 'Mon–Sun 9 AM – 5 PM',
    days: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 6, startTime: '09:00', endTime: '17:00' },
    ],
  },
];
