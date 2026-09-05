<?php

namespace Modules\State\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'nullable', 'string', 'max:10'],
            'country_id' => ['sometimes', 'required', 'integer', 'min:1', Rule::exists('countries', 'id')],
            'status' => ['sometimes', 'nullable', Rule::in(['active', 'inactive'])],
        ];
    }
}