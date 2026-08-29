import { IsIn } from 'class-validator';

export class UpdateQueueStatusDto {
  @IsIn(['WAITING', 'SEND_IN', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'NO_SHOW'])
  status!: 'WAITING' | 'SEND_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'NO_SHOW';
}
