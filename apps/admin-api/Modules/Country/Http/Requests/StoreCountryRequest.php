<?php

namespace Modules\Country\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10', Rule::unique('countries', 'code')],
            'phone_code' => ['nullable', 'string', 'max:10'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ];
    }
}