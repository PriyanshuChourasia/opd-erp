<?php

namespace App\Traits;

use Illuminate\Support\Str;

/**
 * Automatically assigns a UUID primary key when a model is created.
 * Applied to every entity so the whole backend consistently uses UUID ids.
 */
trait HasUuidKey
{
    public $incrementing = false;

    protected $keyType = 'string';

    public static function bootHasUuidKey(): void
    {
        static::creating(function ($model) {
            $key = $model->getKeyName();

            if (empty($model->{$key})) {
                $model->{$key} = (string) Str::uuid();
            }
        });
    }
}
