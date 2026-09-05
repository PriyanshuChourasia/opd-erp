<?php

namespace Modules\Document\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\Document\Contracts\DocumentServiceInterface;
use Modules\Document\Http\Requests\StoreDocumentRequest;
use Modules\Document\Http\Requests\UpdateDocumentRequest;
use Modules\Document\Models\Document;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DocumentService implements DocumentServiceInterface
{
    public function index(Request $request): array
    {
        $limit = min(max((int) $request->input('limit', 10), 1), 100);
        $page = max((int) $request->input('page', 1), 1);

        $query = Document::query();

        if ($request->filled('documentable_type')) {
            $query->where('documentable_type', (string) $request->input('documentable_type'));
        }

        if ($request->filled('documentable_id')) {
            $query->where('documentable_id', (int) $request->input('documentable_id'));
        }

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%");
                    $q->orWhere('original_name', 'like', "%$search%");
                    $q->orWhere('mime_type', 'like', "%$search%");
            });
        }

        $paginator = $query->with('documentable')->orderByDesc('id')
            ->paginate($limit, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())
                ->map(fn (Document $doc) => $this->serialize($doc))->values(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'totalPages' => $paginator->lastPage(),
            ],
        ];
    }

    public function show(int $id): array
    {
        $doc = Document::with('documentable')->find($id);
        if (! $doc) {
            throw new NotFoundHttpException();
        }

        return $this->serialize($doc);
    }

    public function store(StoreDocumentRequest $request): array
    {
        $data = $request->validated();
        $this->assertDocumentableExists($data['documentable_type'], (int) $data['documentable_id']);

        $file = $request->file('file');
        $path = Storage::disk('local')->putFile('documents', $file);

        $doc = Document::create([
            'name' => $data['name'] ?? $file->getClientOriginalName(),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
            'storage_disk' => 'local',
            'description' => $data['description'] ?? null,
            'documentable_type' => $data['documentable_type'],
            'documentable_id' => (int) $data['documentable_id'],
            'uploaded_by' => auth('jwt')->id(),
        ]);

        return $this->serialize($doc->load('documentable'));
    }

    public function update(int $id, UpdateDocumentRequest $request): array
    {
        $doc = Document::find($id);
        if (! $doc) {
            throw new NotFoundHttpException();
        }

        $data = $request->validated();

        if (isset($data['documentable_type'], $data['documentable_id'])) {
            $doc->documentable_type = $data['documentable_type'];
            $doc->documentable_id = (int) $data['documentable_id'];
            $this->assertDocumentableExists($doc->documentable_type, $doc->documentable_id);
        }

        if (isset($data['documentable_type'])) {
            $doc->documentable_type = $data['documentable_type'];
        }

        if (isset($data['documentable_id'])) {
            $doc->documentable_id = (int) $data['documentable_id'];
        }

        if (array_key_exists('documentable_type', $data) || array_key_exists('documentable_id', $data)) {
            $this->assertDocumentableExists((string) $doc->documentable_type, (int) $doc->documentable_id);
        }

        if (isset($data['name'])) {
            $doc->name = $data['name'];
        }

        if (array_key_exists('description', $data)) {
            $doc->description = $data['description'];
        }

        if ($request->hasFile('file')) {
            $this->deleteStoredFile($doc);

            $file = $request->file('file');
            $doc->path = Storage::disk('local')->putFile('documents', $file);
            $doc->original_name = $file->getClientOriginalName();
            $doc->mime_type = $file->getMimeType();
            $doc->size = $file->getSize();
        }

        $doc->save();

        return $this->serialize($doc->fresh(['documentable']));
    }

    public function destroy(int $id): void
    {
        $doc = Document::find($id);
        if (! $doc) {
            throw new NotFoundHttpException();
        }

        $this->deleteStoredFile($doc);
        $doc->delete();
    }

    private function serialize(Document $doc): array
    {
        $out = $doc->toArray();
        $out['id'] = (string) $doc->id;

        if ($doc->relationLoaded('documentable') && $doc->documentable) {
            $parent = $doc->documentable;
            $name = $parent->name
                ?? trim(($parent->first_name ?? '') . ' ' . ($parent->last_name ?? ''))
                ?: $parent->email;

            $out['documentable'] = [
                'type' => $parent->getMorphClass(),
                'id' => (string) $parent->getKey(),
                'name' => $name ?: null,
            ];
        } else {
            $out['documentable'] = null;
        }

        return $out;
    }

    private function assertDocumentableExists(string $type, int $id): void
    {
        $model = \Illuminate\Database\Eloquent\Relations\Relation::getMorphedModel($type);
        if (! $model) {
            throw new HttpException(422, "Unsupported documentable_type '{$type}'.");
        }

        if (! $model::query()->whereKey($id)->exists()) {
            throw new HttpException(422, "The referenced {$type} (id {$id}) does not exist.");
        }
    }

    private function deleteStoredFile(Document $doc): void
    {
        if ($doc->path && ! str_starts_with($doc->path, 'http')) {
            Storage::disk($doc->storage_disk ?: 'local')->delete($doc->path);
        }
    }
}