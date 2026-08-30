<?php

namespace Modules\State\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Country\Models\Country;

class State extends Model
{
    protected $fillable = [
        'name',
        'code',
        'country_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'country_id' => 'integer',
        ];
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}