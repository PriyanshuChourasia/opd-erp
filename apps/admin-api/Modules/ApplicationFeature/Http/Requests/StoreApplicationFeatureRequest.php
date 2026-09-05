<?php

namespace Modules\ApplicationFeature\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicationFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:150'],
            'description' => ['nullable'],
            'module_id' => ['required', Rule::exists('application_modules', 'id')],
        ];
    }
}