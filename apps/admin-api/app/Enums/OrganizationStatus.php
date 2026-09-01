<?php

namespace App\Enums;

/**
 * Lifecycle states of a tenant organization.
 *
 * Only the ACTIVE state permits normal application access.
 */
enum OrganizationStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case SUSPENDED = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Active',
            self::INACTIVE => 'Inactive',
            self::SUSPENDED => 'Suspended',
        };
    }
}