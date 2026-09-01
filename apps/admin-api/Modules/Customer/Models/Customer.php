<?php

namespace Modules\Customer\Models;

use App\Models\User;
use App\Traits\HasUuidKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Modules\Document\Models\Document;
use Modules\License\Models\License;

class Customer extends Model
{
    use HasUuidKey;

    protected $fillable = [
        'first_name',
        'last_name',
        'company_name',
        'tax_number',
        'email',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'city',
        'state',
        'country',
        'pincode',
        'billing_address',
        'billing_city',
        'billing_state',
        'billing_country',
        'billing_pincode',
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

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function licenses(): HasMany
    {
        return $this->hasMany(License::class);
    }
}
