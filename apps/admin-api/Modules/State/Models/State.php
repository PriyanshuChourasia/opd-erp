<?php

namespace Modules\State\Models;

use App\Traits\HasUuidKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Country\Models\Country;

class State extends Model
{
    use HasUuidKey;

    protected $fillable = [
        'name',
        'code',
        'country_id',
        'status',
    ];

    protected function casts(): array
    {
        return [];
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}