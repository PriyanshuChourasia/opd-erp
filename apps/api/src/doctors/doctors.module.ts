import { Module, OnModuleInit } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [AccountingModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
})
export class DoctorsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
