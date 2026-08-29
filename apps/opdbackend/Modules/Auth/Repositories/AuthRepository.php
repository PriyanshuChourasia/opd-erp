<?php

namespace Modules\Auth\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Modules\Auth\Interfaces\AuthRepositoryInterface;
use Modules\Auth\Models\Auth;

class AuthRepository implements AuthRepositoryInterface
{
    public function __construct(
        protected Auth $model
    ) {}

    public function all(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        if (isset($filters['search']) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('id', 'like', "%{$search}%");
            });
        }

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
    }

    public function findById(int $id): Auth
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): Auth
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Auth
    {
        $item = $this->findById($id);
        $item->update($data);
        return $item->fresh();
    }

    public function delete(int $id): bool
    {
        return $this->findById($id)->delete();
    }
}