<?php

namespace Modules\License\Models;

use App\Enums\LicenseStatus;
use App\Traits\HasUuidKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Customer\Models\Customer;
use Modules\Organization\Models\Organization;

class License extends Model
{
    public const STATUS_CREATED = 'created';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_REVOKED = 'revoked';

    use HasUuidKey;

    /**
     * The license activation secret hash is verified one-way and must never
     * leave the database in a readable/orderable form.
     */
    protected $hidden = [
        'activation_secret_hash',
    ];

    protected $fillable = [
        'license_number',
        'customer_id',
        'organization_id',
        'plan_id',
        'status',
        'issue_date',
        'start_date',
        'expiry_date',
        'max_users',
        'max_devices',
        'notes',
        'activated_at',
        'activated_by',
        'revoked_at',
        'revoked_by',
        'revoke_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => LicenseStatus::class,
            'issue_date' => 'date',
            'start_date' => 'date',
            'expiry_date' => 'date',
            'max_users' => 'integer',
            'max_devices' => 'integer',
            'activated_at' => 'datetime',
            'revoked_at' => 'datetime',
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

    public function plan(): BelongsTo
    {
        return $this->belongsTo(LicensePlan::class, 'plan_id');
    }

    public function renewals(): HasMany
    {
        return $this->hasMany(LicenseRenewal::class);
    }

    public function features(): BelongsToMany
    {
        return $this->belongsToMany(LicenseFeature::class, 'license_feature_mapping', 'license_id', 'feature_id')
            ->withPivot(['value', 'limit_value']);
    }

    /**
     * Backward-compatible `plan` attribute — resolves to the plan code from the
     * normalized license_plans reference (previously a free-text string column).
     */
    public function getPlanAttribute(): ?string
    {
        return $this->plan()->value('code');
    }

    /**
     * Backward-compatible `features` attribute — resolves feature codes from the
     * normalized license_feature_mapping (previously a JSON array column).
     *
     * @return array<int, string>
     */
    public function getFeaturesAttribute(): array
    {
        return $this->features()->pluck('license_features.code')->values()->all();
    }
}
