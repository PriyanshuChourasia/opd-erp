<?php

namespace Modules\Permission\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Permission\Models\Permission;

interface PermissionServiceInterface
{
    public function paginate(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): Permission;
    public function create(array $data): Permission;
    public function update(int $id, array $data): Permission;
    public function delete(int $id): bool;
}