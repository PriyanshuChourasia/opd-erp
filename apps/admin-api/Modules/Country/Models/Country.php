<?php

namespace Modules\Country\Models;

use App\Traits\HasUuidKey;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\State\Models\State;

class Country extends Model
{
    use HasUuidKey;

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