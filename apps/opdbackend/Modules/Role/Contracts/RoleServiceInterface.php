<?php

namespace Modules\Role\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Role\Models\Role;

interface RoleServiceInterface
{
    public function paginate(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): Role;
    public function create(array $data): Role;
    public function update(int $id, array $data): Role;
    public function delete(int $id): bool;
}