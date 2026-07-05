import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class BillItemDto {
  @IsString()
  itemType!: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsString()
  itemName!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsInt()
  @Min(0)
  unitPrice!: number;
}

export class CreateBillDto {
  @IsOptional()
  @IsString()
  patientId?: string | null;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  tax?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items!: BillItemDto[];
}
