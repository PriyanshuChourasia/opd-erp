<?php

namespace Modules\License\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\License\Models\License;

class StoreLicenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')],
            'organization_id' => ['nullable', 'integer', Rule::exists('organizations', 'id')],
            'status' => ['nullable', Rule::in([
                License::STATUS_CREATED,
                License::STATUS_ACTIVE,
                License::STATUS_SUSPENDED,
                License::STATUS_EXPIRED,
                License::STATUS_REVOKED,
            ])],
            'issue_date' => ['nullable', 'date'],
            'start_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'plan' => ['nullable', 'string', 'max:50'],
            'max_users' => ['nullable', 'integer', 'min:0'],
            'max_devices' => ['nullable', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string'],
        ];
    }
}
