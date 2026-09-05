import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicineGroupDto } from './create-medicine-group.dto';

export class UpdateMedicineGroupDto extends PartialType(CreateMedicineGroupDto) {}
