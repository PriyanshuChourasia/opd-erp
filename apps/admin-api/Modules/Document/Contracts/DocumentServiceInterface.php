<?php

namespace Modules\Document\Contracts;

use Illuminate\Http\Request;
use Modules\Document\Http\Requests\StoreDocumentRequest;
use Modules\Document\Http\Requests\UpdateDocumentRequest;

interface DocumentServiceInterface
{
    public function index(Request $request): array;

    public function show(int $id): array;

    public function store(StoreDocumentRequest $request): array;

    public function update(int $id, UpdateDocumentRequest $request): array;

    public function destroy(int $id): void;
}