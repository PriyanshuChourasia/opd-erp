import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class PurchaseItemDto {
  @IsString()
  medicineId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsInt()
  @Min(0)
  purchaseRate!: number; // in paise

  @IsOptional()
  @IsInt()
  @Min(0)
  mrp?: number; // in paise

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class CreatePurchaseDto {
  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  supplierLedgerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  tax?: number; // in paise

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;
}
