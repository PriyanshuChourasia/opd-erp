<?php

namespace Modules\User\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:20'],
            'date_of_birth' => ['sometimes', 'nullable', 'date'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'pincode' => ['sometimes', 'nullable', 'string', 'max:20'],
            'avatar_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'status' => ['sometimes', 'nullable', Rule::in(['active', 'inactive'])],
        ];
    }
}