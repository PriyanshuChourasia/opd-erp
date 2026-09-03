<?php

namespace Modules\FinancialYear\Audit;

/**
 * Audit event names for the Financial Year lifecycle.
 *
 * No dedicated audit module has been established yet (Task 4/5 provided the
 * authorization + tenant foundation only). To avoid building a second audit
 * system, these event names are dispatched as plain Laravel events through the
 * FinancialYearService on each lifecycle transition. A future audit listener
 * (or the existing auditing architecture when wired) can subscribe to them.
 *
 * Recommended subscription: prefix the event name with `financial_year.` — e.g.
 * `financial_year.financial-year.created` — when wiring a global listener.
 */
class FinancialYearAuditEvent
{
    public const CREATED = 'financial-year.created';
    public const UPDATED = 'financial-year.updated';
    public const SET_CURRENT = 'financial-year.set-current';
    public const CLOSED = 'financial-year.closed';
    public const DELETED = 'financial-year.deleted';
}
