<?php

namespace Modules\User\Interfaces;

use Modules\User\Models\User;

interface UserRepositoryInterface
{
    public function all(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15);
    public function findById(int $id): User;
    public function create(array $data): User;
    public function update(int $id, array $data): User;
    public function delete(int $id): bool;
}