<?php

namespace Modules\Permission\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Permission\Contracts\PermissionServiceInterface;
use Modules\Permission\Interfaces\PermissionRepositoryInterface;
use Modules\Permission\Models\Permission;

class PermissionService implements PermissionServiceInterface
{
    public function __construct(
        protected PermissionRepositoryInterface $permissionRepository
    ) {}

    public function paginate(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15): LengthAwarePaginator
    {
        return $this->permissionRepository->all($filters, $sortBy, $sortOrder, $perPage);
    }

    public function findById(int $id): Permission
    {
        return $this->permissionRepository->findById($id);
    }

    public function create(array $data): Permission
    {
        return $this->permissionRepository->create($data);
    }

    public function update(int $id, array $data): Permission
    {
        return $this->permissionRepository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->permissionRepository->delete($id);
    }
}