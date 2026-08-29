<?php

namespace Modules\Role\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($this->route('role'))],
            'slug' => ['nullable', 'string', 'max:100', Rule::unique('roles', 'slug')->ignore($this->route('role'))],
            'description' => ['nullable'],
        ];
    }
}