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
            'phone' => $user->phone,
            'gender' => $user->gender,
            'dateOfBirth' => $user->date_of_birth,
            'address' => $user->address,
            'city' => $user->city,
            'state' => $user->state,
            'country' => $user->country,
            'pincode' => $user->pincode,
            'avatarUrl' => $user->avatar_url,
            'status' => $user->status,
            'userableType' => $user->userable_type,
            'userableId' => $user->userable_id ? (string) $user->userable_id : null,
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