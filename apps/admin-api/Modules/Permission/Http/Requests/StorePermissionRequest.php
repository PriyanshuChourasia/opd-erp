<?php

namespace Modules\Permission\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150', Rule::unique('permissions', 'name')],
            'slug' => ['required', 'string', 'max:150', Rule::unique('permissions', 'slug')],
            'module' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable'],
        ];
    }
}