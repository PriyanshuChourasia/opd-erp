<?php

namespace Modules\Customer\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Customer\Contracts\CustomerServiceInterface;
use Modules\Customer\Http\Requests\StoreCustomerRequest;
use Modules\Customer\Http\Requests\UpdateCustomerRequest;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CustomerService implements CustomerServiceInterface
{
    private string $table = 'customers';

    public function index(Request $request): array
    {
        $limit = min(max((int) $request->input('limit', 10), 1), 100);
        $page = max((int) $request->input('page', 1), 1);

        $query = DB::table($this->table);

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%$search%");
                    $q->orWhere('last_name', 'like', "%$search%");
                    $q->orWhere('email', 'like', "%$search%");
                    $q->orWhere('phone', 'like', "%$search%");
            });
        }

        $paginator = $query->orderBy('id')->paginate($limit, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->values(),
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'totalPages' => $paginator->lastPage(),
            ],
        ];
    }

    public function show(int $id): array
    {
        return $this->getById($id);
    }

    public function store(StoreCustomerRequest $request): array
    {
        $data = $request->validated();

        $id = DB::table($this->table)->insertGetId(array_merge($data, [
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        $this->syncUserable($id, isset($data['user_id']) ? (int) $data['user_id'] : null);

        return $this->getById($id);
    }

    public function update(int $id, UpdateCustomerRequest $request): array
    {
        $row = DB::table($this->table)->find($id);
        if (! $row) {
            throw new NotFoundHttpException();
        }

        $data = $request->validated();

        DB::table($this->table)
            ->where('id', $id)
            ->update(array_merge($data, ['updated_at' => now()]));

        if (array_key_exists('user_id', $data)) {
            $this->syncUserable($id, $data['user_id'] ? (int) $data['user_id'] : null);
        }

        return $this->getById($id);
    }

    public function destroy(int $id): void
    {
        $row = DB::table($this->table)->find($id);
        if (! $row) {
            throw new NotFoundHttpException();
        }

        DB::table($this->table)->where('id', $id)->delete();
        $this->clearUserable($id);
    }

    private function getById(int $id): array
    {
        $row = DB::table($this->table)->find($id);
        if (! $row) {
            throw new NotFoundHttpException();
        }

        return (array) $row;
    }

    /**
     * Maintain the polymorphic link users.userable -> customer.
     */
    private function syncUserable(int $customerId, ?int $userId): void
    {
        $this->clearUserable($customerId);

        if (! $userId) {
            return;
        }

        DB::table('users')->where('id', $userId)->update([
            'userable_type' => 'customer',
            'userable_id' => $customerId,
            'updated_at' => now(),
        ]);
    }

    private function clearUserable(int $customerId): void
    {
        DB::table('users')
            ->where('userable_type', 'customer')
            ->where('userable_id', $customerId)
            ->update([
                'userable_type' => null,
                'userable_id' => null,
                'updated_at' => now(),
            ]);
    }
}