<?php

namespace Modules\License\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Customer\Models\Customer;
use Modules\Organization\Models\Organization;

class License extends Model
{
    public const STATUS_CREATED = 'created';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_REVOKED = 'revoked';

    protected $fillable = [
        'license_number',
        'customer_id',
        'organization_id',
        'status',
        'issue_date',
        'start_date',
        'expiry_date',
        'plan',
        'max_users',
        'max_devices',
        'features',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'start_date' => 'date',
            'expiry_date' => 'date',
            'max_users' => 'integer',
            'max_devices' => 'integer',
            'features' => 'array',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
