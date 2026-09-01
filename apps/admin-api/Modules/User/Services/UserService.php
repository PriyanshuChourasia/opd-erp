<?php

namespace Modules\User\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Modules\User\Contracts\UserServiceInterface;
use Modules\User\Http\Requests\StoreUserRequest;
use Modules\User\Http\Requests\UpdateUserRequest;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UserService implements UserServiceInterface
{
    public function index(Request $request): array
    {
        $limit = min(max((int) $request->input('limit', 10), 1), 100);
        $page = max((int) $request->input('page', 1), 1);

        $count = min(max((int) $request->integer('count'), 0), 100);

        if ($count > 0) {
            $query = User::query();
            if ($organizationId = $request->input('organization_id')) {
                $query->where('organization_id', (int) $organizationId);
            }
            $total = (clone $query)->count();
            $users = (clone $query)
                ->latest('id')
                ->offset(($page - 1) * $count)
                ->limit($count)
                ->get();

            return [
                'data' => $users->map(fn (User $user) => $this->toArray($user))->values(),
                'meta' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $count,
                    'totalPages' => (int) ceil($total / max($count, 1)),
                ],
            ];
        }

        $query = User::query();

        if ($organizationId = $request->input('organization_id')) {
            $query->where('organization_id', (int) $organizationId);
        }

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $paginator = $query->latest('id')->paginate($limit, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->map(fn (User $user) => $this->toArray($user))->values(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'totalPages' => $paginator->lastPage(),
            ],
        ];
    }

    public function show(User $user): array
    {
        return $this->toArray($user);
    }

    public function store(StoreUserRequest $request): array
    {
        $user = User::query()->create($request->validated());

        return $this->toArray($user);
    }

    public function update(User $user, UpdateUserRequest $request): array
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return $this->toArray($user);
    }

    public function destroy(User $user): void
    {
        if ((int) auth('jwt')->id() === (int) $user->id) {
            throw new HttpException(422, 'Cannot delete the currently authenticated user.');
        }

        $user->delete();
    }

    private function toArray(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'organization_id' => $user->organization_id ? (string) $user->organization_id : null,
            'createdAt' => $user->created_at?->toIso8601String(),
        ];
    }
}
