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
        $roleId = $this->route('role');
        $organizationId = $this->input('organization_id');

        return [
            'name' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('roles', 'name')->where(fn ($query) => $query->where('organization_id', $organizationId))->ignore($roleId),
            ],
            'slug' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('roles', 'slug')->where(fn ($query) => $query->where('organization_id', $organizationId))->ignore($roleId),
            ],
            'description' => ['nullable'],
            'organization_id' => ['nullable', 'integer', Rule::exists('organizations', 'id')],
        ];
    }
}
