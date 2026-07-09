/**
 * Reusable DayOfWeek enum used throughout scheduling modules.
 *
 * Maps 0=Monday … 6=Sunday so the numeric value aligns with ISO 8601 weekday
 * numbering (Monday-first). Convert to JS Date.getDay() via:
 *   (dayOfWeek + 1) % 7
 */
export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

/** Labels for display / dropdown options. */
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Monday',
  [DayOfWeek.TUESDAY]: 'Tuesday',
  [DayOfWeek.WEDNESDAY]: 'Wednesday',
  [DayOfWeek.THURSDAY]: 'Thursday',
  [DayOfWeek.FRIDAY]: 'Friday',
  [DayOfWeek.SATURDAY]: 'Saturday',
  [DayOfWeek.SUNDAY]: 'Sunday',
};
