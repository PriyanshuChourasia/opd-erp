import { IsIn } from 'class-validator';

export class UpdateQueueStatusDto {
  @IsIn(['WAITING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'NO_SHOW'])
  status!: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'NO_SHOW';
}
