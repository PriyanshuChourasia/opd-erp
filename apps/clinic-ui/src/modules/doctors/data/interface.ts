export interface DoctorScheduleDay {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatients: number;
}

export interface DayForm {
  enabled: boolean;
  id?: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatients: number;
}

export const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;
