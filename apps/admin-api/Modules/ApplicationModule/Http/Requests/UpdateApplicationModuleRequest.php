<?php

namespace Modules\ApplicationModule\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:150', Rule::unique('application_modules', 'name')->ignore($this->route('applicationModule'))],
            'slug' => ['nullable', 'string', 'max:150', Rule::unique('application_modules', 'slug')->ignore($this->route('applicationModule'))],
            'icon' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable'],
        ];
    }
}