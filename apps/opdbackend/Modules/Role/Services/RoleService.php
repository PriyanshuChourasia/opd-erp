<?php

namespace Modules\Role\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Role\Contracts\RoleServiceInterface;
use Modules\Role\Interfaces\RoleRepositoryInterface;
use Modules\Role\Models\Role;

class RoleService implements RoleServiceInterface
{
    public function __construct(
        protected RoleRepositoryInterface $roleRepository
    ) {}

    public function paginate(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15): LengthAwarePaginator
    {
        return $this->roleRepository->all($filters, $sortBy, $sortOrder, $perPage);
    }

    public function findById(int $id): Role
    {
        return $this->roleRepository->findById($id);
    }

    public function create(array $data): Role
    {
        return $this->roleRepository->create($data);
    }

    public function update(int $id, array $data): Role
    {
        return $this->roleRepository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->roleRepository->delete($id);
    }
}