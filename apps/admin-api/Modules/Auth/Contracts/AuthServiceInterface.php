<?php

namespace Modules\Auth\Contracts;

use Modules\Auth\Http\Requests\LoginRequest;

interface AuthServiceInterface
{
    /**
     * Attempt to authenticate a user and issue a JWT.
     */
    public function login(LoginRequest $request): array;

    /**
     * Return the currently authenticated user as an array.
     */
    public function currentUser($user): array;

    /**
     * Invalidate (blacklist) the current JWT.
     */
    public function logout($user): void;

    /**
     * Issue a fresh JWT from the current (still valid) one.
     */
    public function refresh(): array;
}