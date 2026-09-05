<?php

namespace App\Enums;

/**
 * Lifecycle states of a user account.
 *
 * Only the ACTIVE state permits normal authentication. INACTIVE and
 * SUSPENDED accounts are denied at login with a generic response.
 */
enum UserStatus: string
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