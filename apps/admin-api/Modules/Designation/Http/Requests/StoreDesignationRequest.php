<?php

namespace Modules\Designation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDesignationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
            'department_id' => ['required', Rule::exists('departments', 'id')],
        ];
    }
}