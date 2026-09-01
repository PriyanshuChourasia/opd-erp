import { IsIn, IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsIn(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'])
  status!: string;

  /** Required when status is CANCELLED. */
  @ValidateIf((o) => o.status === 'CANCELLED')
  @IsString()
  cancellationReason?: string;

  /** Required when status is CANCELLED or NO_SHOW and money has been collected. */
  @IsOptional()
  @IsIn(['REFUND', 'FORFEIT'])
  refundDecision?: 'REFUND' | 'FORFEIT';

  /** Required when refundDecision is REFUND. */
  @ValidateIf((o) => o.refundDecision === 'REFUND')
  @IsInt()
  @Min(1)
  refundAmount?: number;

  /** Required when refundDecision is set (either REFUND or FORFEIT). */
  @ValidateIf((o) => o.refundDecision !== undefined)
  @IsString()
  refundReason?: string;
}
