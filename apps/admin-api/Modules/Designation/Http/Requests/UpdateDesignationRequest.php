<?php

namespace Modules\Designation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDesignationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
            'department_id' => ['nullable', Rule::exists('departments', 'id')],
        ];
    }
}