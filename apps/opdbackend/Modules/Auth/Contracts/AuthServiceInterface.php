<?php

namespace Modules\Auth\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Auth\Models\Auth;

interface AuthServiceInterface
{
    public function paginate(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15): LengthAwarePaginator;
    public function findById(int $id): Auth;
    public function create(array $data): Auth;
    public function update(int $id, array $data): Auth;
    public function delete(int $id): bool;
}