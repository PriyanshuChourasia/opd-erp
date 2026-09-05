<?php

namespace Modules\Employee\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255', 'email', Rule::unique('employees', 'email')->ignore($this->route('employee'))],
            'phone' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:20'],
            'date_of_joining' => ['nullable', 'date'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
            'department_id' => ['nullable', Rule::exists('departments', 'id')],
            'designation_id' => ['nullable', Rule::exists('designations', 'id')],
            'user_id' => ['nullable', Rule::exists('users', 'id'), Rule::unique('employees', 'user_id')->ignore($this->route('employee'))],
        ];
    }
}