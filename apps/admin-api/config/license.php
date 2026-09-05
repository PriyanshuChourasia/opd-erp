<?php

return [

    /*
    |--------------------------------------------------------------------------
    | License Grace Period
    |--------------------------------------------------------------------------
    |
    | Number of days a license remains usable (read-only, limited access)
    | after its expiry date has passed. Non-hard-coded: driven by env so it can
    | be tuned per environment. Set to 0 to disable the grace period entirely.
    |
    | During the grace window a user may still:
    |   - log in
    |   - view data
    |   - reach renewal/activation surfaces
    |
    | Write operations are NOT allowed during grace (access level "grace").
    |
    */

    'grace_period_days' => (int) env('LICENSE_GRACE_PERIOD_DAYS', 7),

    /*
    |--------------------------------------------------------------------------
    | Access Levels
    |--------------------------------------------------------------------------
    |
    | "none"   -> no access (no license, not started, created, suspended,
    |             revoked, expired beyond grace)
    | "grace"  -> limited access while inside the post-expiry grace window
    | "full"   -> full normal application access
    |
    */

    'access_levels' => [
        'none' => 'none',
        'grace' => 'grace',
        'full' => 'full',
    ],
];