<?php

namespace Modules\Role\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'name')->where(fn ($query) => $query->where('organization_id', $this->input('organization_id'))),
            ],
            'slug' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'slug')->where(fn ($query) => $query->where('organization_id', $this->input('organization_id'))),
            ],
            'description' => ['nullable'],
            'organization_id' => ['nullable', 'integer', Rule::exists('organizations', 'id')],
        ];
    }
}
