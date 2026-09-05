<?php

namespace Modules\Organization\Models;

use App\Enums\OrganizationStatus;
use App\Models\User;
use App\Traits\HasUuidKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\License\Models\License;

class Organization extends Model
{
    use SoftDeletes, HasUuidKey;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_SUSPENDED = 'suspended';

    protected $fillable = [
        'organization_code',
        'legal_name',
        'display_name',
        'registration_number',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'pincode',
        'timezone',
        'locale',
        'currency',
        'status',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'status' => OrganizationStatus::class,
        ];
    }

    public function licenses(): HasMany
    {
        return $this->hasMany(License::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(\Modules\Role\Models\Role::class);
    }

    /**
     * Backward-compatible `name` attribute — resolves to display_name, falling
     * back to legal_name (the schema uses those Task-2 columns instead of a
     * free-text `name`).
     */
    public function getNameAttribute(): string
    {
        return $this->display_name ?? $this->legal_name;
    }
}
