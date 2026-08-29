<?php

namespace Modules\Auth\Controllers;

use Modules\Auth\Contracts\AuthServiceInterface;
use Modules\Auth\Http\Requests\LoginRequest;
use Modules\Auth\Services\AuthService;

class AuthController
{
    public function __construct(private readonly AuthService $service)
    {
    }

    public function login(LoginRequest $request): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->service->login($request));
    }

    public function me(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->service->currentUser(auth('jwt')->user()));
    }

    public function refresh(): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->service->refresh());
    }

    public function logout(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $this->service->logout(auth('jwt')->user());

        return response()->json(['message' => 'Logged out successfully.']);
    }
}