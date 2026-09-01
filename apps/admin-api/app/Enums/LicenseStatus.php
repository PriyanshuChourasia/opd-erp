<?php

namespace App\Enums;

enum LicenseStatus: string
{
    case CREATED = 'created';
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case EXPIRED = 'expired';
    case REVOKED = 'revoked';

    public function label(): string
    {
        return match ($this) {
            self::CREATED => 'Created',
            self::ACTIVE => 'Active',
            self::SUSPENDED => 'Suspended',
            self::EXPIRED => 'Expired',
            self::REVOKED => 'Revoked',
        };
    }
}
