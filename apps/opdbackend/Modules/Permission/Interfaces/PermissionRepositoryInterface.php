<?php

namespace Modules\Permission\Interfaces;

use Modules\Permission\Models\Permission;

interface PermissionRepositoryInterface
{
    public function all(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15);
    public function findById(int $id): Permission;
    public function create(array $data): Permission;
    public function update(int $id, array $data): Permission;
    public function delete(int $id): bool;
}