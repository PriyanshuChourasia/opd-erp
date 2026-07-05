export class UpdateQueueStatusDto {
  status!: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'NO_SHOW';
}
