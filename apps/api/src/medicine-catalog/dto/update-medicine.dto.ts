import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicineDto } from './create-medicine.dto';

export class UpdateMedicineDto extends PartialType(CreateMedicineDto) {}
