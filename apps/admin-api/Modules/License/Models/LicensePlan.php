<?php

namespace Modules\License\Models;

use App\Traits\HasUuidKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LicensePlan extends Model
{
    use HasUuidKey;

    protected $fillable = [
        'code',
        'name',
        'description',
        'price',
        'currency',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function licenses(): HasMany
    {
        return $this->hasMany(License::class, 'plan_id');
    }
}
