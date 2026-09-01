<?php

namespace Modules\UserRole\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\UserRole\Contracts\UserRoleServiceInterface;
use Modules\UserRole\Http\Requests\StoreUserRoleRequest;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class UserRoleService implements UserRoleServiceInterface
{
    private string $table = 'user_role';

    public function index(Request $request): array
    {
        $limit = min(max((int) $request->input('limit', 10), 1), 100);
        $page = max((int) $request->input('page', 1), 1);

        $query = DB::table($this->table)
            ->leftJoin('users', 'user_role.user_id', '=', 'users.id')
            ->leftJoin('roles', 'user_role.role_id', '=', 'roles.id')
            ->select(['user_role.id', 'user_role.user_id', 'user_role.user_id', 'users.name as user_id___name', 'users.email as user_id___email', 'user_role.role_id', 'roles.name as role_id___name']);

        if ($userId = $request->input('user_id')) {
            $query->where($this->table.'.user_id', (int) $userId);
        }

        if ($organizationId = $request->input('organization_id')) {
            $query->where('users.organization_id', (int) $organizationId);
        }

        $paginator = $query->orderByDesc($this->table.'.id')->paginate($limit, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->map(function ($row) {
                return [
                    'id' => (string) $row->id,
                    'user' => [
                        'id' => (string) $row->user_id,
                        'name' => $row->user_id___name,
                        'email' => $row->user_id___email,
                    ],
                    'role' => [
                        'id' => (string) $row->role_id,
                        'name' => $row->role_id___name,
                    ],
                ];
            })->values(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'totalPages' => $paginator->lastPage(),
            ],
        ];
    }

    public function store(StoreUserRoleRequest $request): array
    {
        $data = $request->validated();

        $this->assertSameOrganization((int) $data['user_id'], (int) $data['role_id']);

        $exists = DB::table($this->table)
            ->where('user_id', $data['user_id'])
            ->where('role_id', $data['role_id'])
            ->exists();

        if ($exists) {
            throw new HttpException(422, 'This assignment already exists.');
        }

        $id = DB::table($this->table)->insertGetId(array_merge($data, [
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return $this->getById($id);
    }

    /**
     * A user and a role can only be linked when they belong to the same organization.
     */
    private function assertSameOrganization(int $userId, int $roleId): void
    {
        $userOrgId = DB::table('users')->where('id', $userId)->value('organization_id');
        $roleOrgId = DB::table('roles')->where('id', $roleId)->value('organization_id');

        if ($userOrgId !== $roleOrgId) {
            throw new HttpException(422, 'User and role must belong to the same organization.');
        }
    }

    public function destroy(int $id): void
    {
        $row = DB::table($this->table)->find($id);
        if (! $row) {
            throw new NotFoundHttpException;
        }
        DB::table($this->table)->where('id', $id)->delete();
    }

    private function getById(int $id): array
    {
        $row = DB::table($this->table)->find($id);
        if (! $row) {
            throw new NotFoundHttpException;
        }

        return [
            'id' => (string) $row->id,
            'user_id' => (string) $row->user_id,
            'role_id' => (string) $row->role_id,
        ];
    }
}
