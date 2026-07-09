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
