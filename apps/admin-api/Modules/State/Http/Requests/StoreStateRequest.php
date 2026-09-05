<?php

namespace Modules\State\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:10'],
            'country_id' => ['required', 'integer', 'min:1', Rule::exists('countries', 'id')],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ];
    }
}