<?php

namespace Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required_without:username', 'string', 'email'],
            'username' => ['required_without:email', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }
}