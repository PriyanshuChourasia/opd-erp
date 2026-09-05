<?php

namespace App\Enums;

/**
 * Lifecycle states of a financial year.
 *
 * OPEN: The financial year can be used for normal accounting operations.
 * CLOSED: The financial year is finalized. Normal accounting modifications are blocked.
 */
enum FinancialYearStatus: string
{
    case OPEN = 'open';
    case CLOSED = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::OPEN => 'Open',
            self::CLOSED => 'Closed',
        };
    }
}
