<?php

namespace Modules\Role\Interfaces;

use Modules\Role\Models\Role;

interface RoleRepositoryInterface
{
    public function all(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15);
    public function findById(int $id): Role;
    public function create(array $data): Role;
    public function update(int $id, array $data): Role;
    public function delete(int $id): bool;
}