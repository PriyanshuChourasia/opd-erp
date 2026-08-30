<?php

namespace Modules\Customer\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'city',
        'state',
        'country',
        'pincode',
        'status',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}