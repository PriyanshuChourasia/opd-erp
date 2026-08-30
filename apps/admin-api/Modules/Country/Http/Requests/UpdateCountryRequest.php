<?php

namespace Modules\Country\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $countryId = $this->route('country');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:10', Rule::unique('countries', 'code')->ignore($countryId)],
            'phone_code' => ['sometimes', 'nullable', 'string', 'max:10'],
            'status' => ['sometimes', 'nullable', Rule::in(['active', 'inactive'])],
        ];
    }
}