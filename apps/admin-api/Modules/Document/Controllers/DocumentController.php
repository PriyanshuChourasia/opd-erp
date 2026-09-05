<?php

namespace Modules\Document\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Document\Contracts\DocumentServiceInterface;
use Modules\Document\Http\Requests\StoreDocumentRequest;
use Modules\Document\Http\Requests\UpdateDocumentRequest;

class DocumentController
{
    public function __construct(private readonly DocumentServiceInterface $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->service->show($id));
    }

    public function update(int $id, UpdateDocumentRequest $request): JsonResponse
    {
        return response()->json($this->service->update($id, $request));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->destroy($id);

        return response()->json(null, 204);
    }
}