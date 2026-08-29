<?php

namespace Modules\Permission\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:150', Rule::unique('permissions', 'name')->ignore($this->route('permission'))],
            'slug' => ['nullable', 'string', 'max:150', Rule::unique('permissions', 'slug')->ignore($this->route('permission'))],
            'module' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable'],
        ];
    }
}