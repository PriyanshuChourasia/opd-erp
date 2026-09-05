<?php

namespace Modules\Document\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['sometimes', 'required', 'file', 'max:10240'],
            'documentable_type' => ['sometimes', 'required', 'string', 'max:100'],
            'documentable_id' => ['sometimes', 'required', 'integer', 'min:1'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}