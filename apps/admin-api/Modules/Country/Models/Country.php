<?php

namespace Modules\Country\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\State\Models\State;

class Country extends Model
{
    protected $fillable = [
        'name',
        'code',
        'phone_code',
        'status',
    ];

    public function states(): HasMany
    {
        return $this->hasMany(State::class);
    }
}