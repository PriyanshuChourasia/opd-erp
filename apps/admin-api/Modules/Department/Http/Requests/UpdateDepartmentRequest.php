<?php

namespace Modules\Department\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', Rule::unique('departments', 'code')->ignore($this->route('department'))],
            'description' => ['nullable'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ];
    }
}