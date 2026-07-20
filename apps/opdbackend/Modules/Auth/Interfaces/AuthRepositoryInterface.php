<?php

namespace Modules\Auth\Interfaces;

use Modules\Auth\Models\Auth;

interface AuthRepositoryInterface
{
    public function all(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15);
    public function findById(int $id): Auth;
    public function create(array $data): Auth;
    public function update(int $id, array $data): Auth;
    public function delete(int $id): bool;
}