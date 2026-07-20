<?php

namespace Modules\Auth\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Auth\Contracts\AuthServiceInterface;
use Modules\Auth\Interfaces\AuthRepositoryInterface;
use Modules\Auth\Models\Auth;

class AuthService implements AuthServiceInterface
{
    public function __construct(
        protected AuthRepositoryInterface $authRepository
    ) {}

    public function paginate(array $filters = [], string $sortBy = 'id', string $sortOrder = 'desc', int $perPage = 15): LengthAwarePaginator
    {
        return $this->authRepository->all($filters, $sortBy, $sortOrder, $perPage);
    }

    public function findById(int $id): Auth
    {
        return $this->authRepository->findById($id);
    }

    public function create(array $data): Auth
    {
        return $this->authRepository->create($data);
    }

    public function update(int $id, array $data): Auth
    {
        return $this->authRepository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->authRepository->delete($id);
    }
}