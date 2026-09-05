<?php

namespace Modules\Designation\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Designation\Contracts\DesignationServiceInterface;
use Modules\Designation\Http\Requests\StoreDesignationRequest;
use Modules\Designation\Http\Requests\UpdateDesignationRequest;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DesignationService implements DesignationServiceInterface
{
    private string $table = 'designations';

    public function index(Request $request): array
    {
        $limit = min(max((int) $request->input('limit', 10), 1), 100);
        $page = max((int) $request->input('page', 1), 1);

        $query = DB::table($this->table);

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%");
            });
        }

        $paginator = $query->orderBy('name')->paginate($limit, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->values(),
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
        return $this->getById($id);
    }

    public function store(StoreDesignationRequest $request): array
    {
        $id = DB::table($this->table)->insertGetId(array_merge($request->validated(), [
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return $this->getById($id);
    }

    public function update(int $id, UpdateDesignationRequest $request): array
    {
        $row = DB::table($this->table)->find($id);
        if (! $row) {
            throw new NotFoundHttpException();
        }

        DB::table($this->table)
            ->where('id', $id)
            ->update(array_merge($request->validated(), ['updated_at' => now()]));

        return $this->getById($id);
    }

    public function destroy(int $id): void
    {
        $row = DB::table($this->table)->find($id);
        if (! $row) {
            throw new NotFoundHttpException();
        }
        DB::table($this->table)->where('id', $id)->delete();
    }

    private function getById(int $id): array
    {
        $row = DB::table($this->table)->find($id);
        if (! $row) {
            throw new NotFoundHttpException();
        }

        return (array) $row;
    }
}