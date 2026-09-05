<?php

namespace Modules\License\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\License\Models\License;

class UpdateLicenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['sometimes', 'required', 'integer', Rule::exists('customers', 'id')],
            'organization_id' => ['sometimes', 'nullable', 'integer', Rule::exists('organizations', 'id')],
            'status' => ['sometimes', 'required', Rule::in([
                License::STATUS_CREATED,
                License::STATUS_ACTIVE,
                License::STATUS_SUSPENDED,
                License::STATUS_EXPIRED,
                License::STATUS_REVOKED,
            ])],
            'issue_date' => ['sometimes', 'nullable', 'date'],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'expiry_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'plan' => ['sometimes', 'nullable', 'string', 'max:50'],
            'max_users' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'max_devices' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'features' => ['sometimes', 'nullable', 'array'],
            'features.*' => ['string'],
        ];
    }
}
