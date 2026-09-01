<?php

namespace Modules\Auth\Services;

use App\Models\User;
use Modules\Auth\Contracts\AuthServiceInterface;
use Modules\Auth\Http\Requests\LoginRequest;
use Modules\License\Models\License;
use Modules\Organization\Services\TenantService;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthService implements AuthServiceInterface
{
    public function __construct(private readonly TenantService $tenantService) {}

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

        $user = auth('jwt')->user();
        $this->assertEntitled($user);

        return $this->respondWithToken($token);
    }

    public function currentUser($user): array
    {
        $organization = $this->tenantService->organizationFor($user);
        $license = $this->tenantService->licenseFor($organization);

        $licenseData = $license ? [
            'id' => (string) $license->id,
            'license_number' => $license->license_number,
            'status' => $license->status,
            'plan' => $license->plan,
            'start_date' => $license->start_date?->toDateString(),
            'expiry_date' => $license->expiry_date?->toDateString(),
        ] : null;

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
            'organizationId' => $organization ? (string) $organization->id : null,
            'organization' => $organization ? [
                'id' => (string) $organization->id,
                'name' => $organization->name,
                'status' => $organization->status,
            ] : null,
            'license' => $licenseData,
        ];
    }

    /**
     * Confirm the user's organization holds a valid active license; otherwise
     * deny access. This must NOT be part of the token issuance — the license
     * is re-validated server-side rather than trusted from the client.
     */
    private function assertEntitled(User $user): void
    {
        $organization = $this->tenantService->organizationFor($user);

        if (! $organization) {
            throw new HttpException(403, 'Your account is not linked to any organization.');
        }

        if ($organization->status !== 'active') {
            throw new HttpException(403, 'Your organization is inactive. Contact support.');
        }

        if (! $this->tenantService->validLicense($organization)) {
            $license = $this->tenantService->licenseFor($organization);
            $reason = match ($license?->status) {
                License::STATUS_SUSPENDED => 'Your license is suspended. Contact support.',
                License::STATUS_EXPIRED => 'Your license has expired. Please renew.',
                License::STATUS_REVOKED => 'Your license has been revoked. Contact support.',
                default => 'No active license found. Contact your administrator.',
            };

            throw new HttpException(403, $reason);
        }
    }

    public function logout($user): void
    {
        auth('jwt')->logout();
    }

    public function refresh(): array
    {
        $user = auth('jwt')->user();
        $this->assertEntitled($user);

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
