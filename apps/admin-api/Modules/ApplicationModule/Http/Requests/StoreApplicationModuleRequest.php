<?php

namespace Modules\ApplicationModule\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicationModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150', Rule::unique('application_modules', 'name')],
            'slug' => ['required', 'string', 'max:150', Rule::unique('application_modules', 'slug')],
            'icon' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable'],
        ];
    }
}