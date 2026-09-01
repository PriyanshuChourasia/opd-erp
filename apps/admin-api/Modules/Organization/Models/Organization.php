<?php

namespace Modules\Organization\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\License\Models\License;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'legal_name',
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
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
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
}
