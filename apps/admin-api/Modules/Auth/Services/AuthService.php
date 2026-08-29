<?php

namespace Modules\Auth\Services;

use Modules\Auth\Contracts\AuthServiceInterface;
use Modules\Auth\Http\Requests\LoginRequest;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthService implements AuthServiceInterface
{
    public function login(LoginRequest $request): array
    {
        $credentials = ['password' => $request->password];

        if ($request->filled('email')) {
            $credentials['email'] = $request->input('email');
        } else {
            $credentials['name'] = $request->input('username');
        }

        if (! $token = auth('jwt')->attempt($credentials)) {
            throw new UnauthorizedHttpException('Bearer', 'Invalid credentials.');
        }

        return $this->respondWithToken($token);
    }

    public function currentUser($user): array
    {
        return [
            'id' => (string) $user->id,
            'username' => $user->email,
            'firstName' => $user->name,
            'lastName' => '',
            'email' => $user->email,
            'roleId' => '',
            'roleName' => 'Admin',
            'permissions' => [],
        ];
    }

    public function logout($user): void
    {
        auth('jwt')->logout();
    }

    public function refresh(): array
    {
        return $this->respondWithToken(auth('jwt')->refresh());
    }

    private function respondWithToken(string $token): array
    {
        return [
            'accessToken' => $token,
            'tokenType' => 'bearer',
            'expiresIn' => auth('jwt')->factory()->getTTL() * 60,
            'user' => $this->currentUser(auth('jwt')->user()),
        ];
    }
}