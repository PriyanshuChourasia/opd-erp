import { PartialType } from '@nestjs/mapped-types';
import { CreateFinancialYearDto } from './create-financial-year.dto';

export class UpdateFinancialYearDto extends PartialType(CreateFinancialYearDto) {}
