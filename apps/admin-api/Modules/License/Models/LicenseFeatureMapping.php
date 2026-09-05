<?php

namespace Modules\License\Models;

use App\Traits\HasUuidKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LicenseFeatureMapping extends Model
{
    use HasUuidKey;

    protected $table = 'license_feature_mapping';

    protected $fillable = [
        'license_id',
        'feature_id',
        'value',
        'limit_value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'boolean',
            'limit_value' => 'integer',
        ];
    }

    public function license(): BelongsTo
    {
        return $this->belongsTo(License::class);
    }

    public function feature(): BelongsTo
    {
        return $this->belongsTo(LicenseFeature::class);
    }
}
