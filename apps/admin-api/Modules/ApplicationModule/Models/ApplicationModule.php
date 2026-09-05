<?php

namespace Modules\ApplicationModule\Models;

use App\Traits\HasUuidKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApplicationModule extends Model
{
    use HasUuidKey;

    protected $fillable = [
        'name',
        'slug',
        'icon',
        'description',
    ];

    public function features(): HasMany
    {
        return $this->hasMany(\Modules\ApplicationFeature\Models\ApplicationFeature::class, 'module_id');
    }
}
