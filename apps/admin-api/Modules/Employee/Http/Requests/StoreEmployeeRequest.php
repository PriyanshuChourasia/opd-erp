<?php

namespace Modules\Employee\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'max:255', 'email', Rule::unique('employees', 'email')],
            'phone' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:20'],
            'date_of_joining' => ['nullable', 'date'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
            'department_id' => ['required', Rule::exists('departments', 'id')],
            'designation_id' => ['required', Rule::exists('designations', 'id')],
            'user_id' => ['nullable', Rule::exists('users', 'id'), Rule::unique('employees', 'user_id')],
        ];
    }
}