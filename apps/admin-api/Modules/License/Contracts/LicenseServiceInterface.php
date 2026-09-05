<?php

namespace Modules\License\Contracts;

use Illuminate\Http\Request;
use Modules\License\Http\Requests\StoreLicenseRequest;
use Modules\License\Http\Requests\UpdateLicenseRequest;
use Modules\License\Models\License;

interface LicenseServiceInterface
{
    public function index(Request $request): array;

    public function show(License $license): array;

    public function store(StoreLicenseRequest $request): array;

    public function update(License $license, UpdateLicenseRequest $request): array;

    public function destroy(License $license): void;
}
