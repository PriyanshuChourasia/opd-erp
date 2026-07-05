export class CreateAppointmentDto {
  patientId!: string;
  doctorId!: string;
  date!: string;
  type?: string;
  fee?: number;
  notes?: string;
}
