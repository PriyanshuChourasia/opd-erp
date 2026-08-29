<?php

namespace Modules\User\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\User\Contracts\UserServiceInterface;
use Modules\User\Http\Requests\StoreUserRequest;
use Modules\User\Http\Requests\UpdateUserRequest;
use Modules\User\Services\UserService;

class UserController
{
    public function __construct(private readonly UserService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->index($request));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        return response()->json($this->service->store($request), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($this->service->show($user));
    }

    public function update(User $user, UpdateUserRequest $request): JsonResponse
    {
        return response()->json($this->service->update($user, $request));
    }

    public function destroy(User $user): JsonResponse
    {
        $this->service->destroy($user);

        return response()->json(null, 204);
    }
}