import { Module, OnModuleInit } from '@nestjs/common';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
