<?php

namespace Modules\License\Services;

use Carbon\Carbon;
use Modules\License\Models\License;

/**
 * Immutable result of evaluating an organization's entitlement to use the
 * application. `level` is one of: none | grace | full (see config/license.php).
 */
class Entitlement
{
    public const LEVEL_NONE = 'none';

    public const LEVEL_GRACE = 'grace';

    public const LEVEL_FULL = 'full';

    public function __construct(
        public readonly bool $entitled,
        public readonly string $level,
        public readonly ?License $license = null,
        public readonly ?string $reason = null,
        public readonly ?string $reasonCode = null,
        public readonly ?Carbon $graceEndsAt = null,
        public readonly ?Carbon $expiresAt = null,
    ) {
    }

    public static function full(License $license, ?Carbon $expiresAt = null): self
    {
        return new self(true, self::LEVEL_FULL, $license, reason: 'Active license', reasonCode: 'ACTIVE', expiresAt: $expiresAt);
    }

    public static function grace(License $license, Carbon $graceEndsAt): self
    {
        return new self(
            true,
            self::LEVEL_GRACE,
            $license,
            reason: 'License expired; within grace period',
            reasonCode: 'EXPIRED_GRACE',
            graceEndsAt: $graceEndsAt,
            expiresAt: $license->expiry_date,
        );
    }

    public static function denied(?string $reason = null, ?string $reasonCode = null, ?License $license = null, ?Carbon $expiresAt = null): self
    {
        return new self(false, self::LEVEL_NONE, $license, reason: $reason, reasonCode: $reasonCode, expiresAt: $expiresAt);
    }

    public function isEntitled(): bool
    {
        return $this->entitled;
    }

    public function isFull(): bool
    {
        return $this->level === self::LEVEL_FULL;
    }

    public function isGrace(): bool
    {
        return $this->level === self::LEVEL_GRACE;
    }

    /**
     * Write access is only granted under a full entitlement. Grace access is
     * intentionally read/renewal-only.
     */
    public function allowsWrites(): bool
    {
        return $this->level === self::LEVEL_FULL;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'entitled' => $this->entitled,
            'level' => $this->level,
            'reasonCode' => $this->reasonCode,
            'reason' => $this->reason,
            'graceEndsAt' => $this->graceEndsAt?->toDateString(),
            'expiresAt' => $this->expiresAt?->toDateString(),
        ];
    }
}