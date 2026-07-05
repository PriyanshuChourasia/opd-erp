export class UpsertDoctorScheduleDto {
  doctorId!: string;
  dayOfWeek!: number;
  startTime!: string;
  endTime!: string;
  slotDuration?: number;
  maxPatients?: number;
}
