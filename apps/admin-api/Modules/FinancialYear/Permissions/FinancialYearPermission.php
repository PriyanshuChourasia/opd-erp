<?php

namespace Modules\FinancialYear\Permissions;

/**
 * Financial Year permission slugs (Task 4 authorization foundation).
 *
 * These are stored in the `permissions` table with `module = 'financial_year'`
 * and granted to roles / users. Checks are performed via the Gate binding wired
 * in AppServiceProvider (AuthorizationService). Role names are never hard-coded.
 */
class FinancialYearPermission
{
    public const READ = 'financial-year.read';
    public const CREATE = 'financial-year.create';
    public const UPDATE = 'financial-year.update';
    public const SET_CURRENT = 'financial-year.set-current';
    public const CLOSE = 'financial-year.close';
    public const DELETE = 'financial-year.delete';

    public const ALL = [
        self::READ,
        self::CREATE,
        self::UPDATE,
        self::SET_CURRENT,
        self::CLOSE,
        self::DELETE,
    ];
}
