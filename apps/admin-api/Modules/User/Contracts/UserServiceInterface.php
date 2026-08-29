<?php

namespace Modules\User\Contracts;

use App\Models\User;
use Illuminate\Http\Request;
use Modules\User\Http\Requests\StoreUserRequest;
use Modules\User\Http\Requests\UpdateUserRequest;

interface UserServiceInterface
{
    /**
     * Paginated, optionally searchable list of users.
     */
    public function index(Request $request): array;

    /**
     * Single user as a JSON-able array.
     */
    public function show(User $user): array;

    /**
     * Create a user and return the created resource.
     */
    public function store(StoreUserRequest $request): array;

    /**
     * Update a user and return the updated resource.
     */
    public function update(User $user, UpdateUserRequest $request): array;

    /**
     * Delete a user.
     */
    public function destroy(User $user): void;
}