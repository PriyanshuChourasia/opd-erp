import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { LicenseValidationService } from './license-validation.service';
import { TenantContextGuard } from './tenant-context.guard';

@Global()
@Module({
    providers: [TenantContextService, LicenseValidationService, TenantContextGuard],
    exports: [TenantContextService, LicenseValidationService, TenantContextGuard],
})
export class TenantModule {}