import { IsString } from 'class-validator';

export class CreateDoctorDepartmentDto {
  @IsString()
  doctorId!: string;

  @IsString()
  departmentId!: string;
}
