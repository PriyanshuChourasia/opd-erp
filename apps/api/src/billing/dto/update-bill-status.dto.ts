import { IsString, IsIn } from 'class-validator';

export class UpdateBillStatusDto {
  @IsString()
  @IsIn(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'CANCELLED'])
  status!: string;
}
