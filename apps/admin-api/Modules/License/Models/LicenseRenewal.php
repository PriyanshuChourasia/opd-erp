<?php

namespace Modules\License\Models;

use App\Models\User;
use App\Traits\HasUuidKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LicenseRenewal extends Model
{
    use HasUuidKey;

    protected $fillable = [
        'license_id',
        'previous_expiry_date',
        'new_expiry_date',
        'previous_plan_id',
        'new_plan_id',
        'type',
        'amount',
        'currency',
        'transaction_reference',
        'renewed_by',
        'renewed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'previous_expiry_date' => 'date',
            'new_expiry_date' => 'date',
            'amount' => 'decimal:2',
            'renewed_at' => 'datetime',
        ];
    }

    public function license(): BelongsTo
    {
        return $this->belongsTo(License::class);
    }

    public function previousPlan(): BelongsTo
    {
        return $this->belongsTo(LicensePlan::class, 'previous_plan_id');
    }

    public function newPlan(): BelongsTo
    {
        return $this->belongsTo(LicensePlan::class, 'new_plan_id');
    }

    public function renewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'renewed_by');
    }
}
