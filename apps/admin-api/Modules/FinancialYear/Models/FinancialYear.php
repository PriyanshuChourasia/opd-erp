<?php

namespace Modules\FinancialYear\Models;

use App\Enums\FinancialYearStatus;
use App\Models\User;
use App\Traits\HasUuidKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Organization\Models\Organization;

class FinancialYear extends Model
{
    use HasUuidKey, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'code',
        'start_date',
        'end_date',
        'status',
        'is_current',
        'closed_at',
        'closed_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'status' => FinancialYearStatus::class,
            'is_current' => 'boolean',
            'closed_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function scopeForOrganization($query, string $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', FinancialYearStatus::OPEN);
    }

    public function scopeClosed($query)
    {
        return $query->where('status', FinancialYearStatus::CLOSED);
    }
}
