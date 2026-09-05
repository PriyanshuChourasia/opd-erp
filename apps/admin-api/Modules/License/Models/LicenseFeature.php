<?php

namespace Modules\License\Models;

use App\Traits\HasUuidKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LicenseFeature extends Model
{
    use HasUuidKey;

    protected $fillable = [
        'code',
        'name',
        'description',
        'module_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(\Modules\ApplicationModule\Models\ApplicationModule::class, 'module_id');
    }

    public function licenses(): BelongsToMany
    {
        return $this->belongsToMany(License::class, 'license_feature_mapping', 'feature_id', 'license_id')
            ->withPivot(['value', 'limit_value']);
    }
}
