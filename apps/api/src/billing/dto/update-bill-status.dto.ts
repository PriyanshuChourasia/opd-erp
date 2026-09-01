import { IsString, IsIn } from 'class-validator';

export class UpdateBillStatusDto {
  @IsString()
  @IsIn(['PENDING', 'PAID', 'PARTIAL', 'PARTIALLY_PAID', 'REFUNDED', 'CANCELLED'])
  status!: string;
}
