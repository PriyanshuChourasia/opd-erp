import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAddressDto } from './create-address.dto';

/**
 * Updating an address cannot change the polymorphic relationship.
 */
export class UpdateAddressDto extends PartialType(
  OmitType(CreateAddressDto, ['addressableType', 'addressableId'] as const),
) {}
