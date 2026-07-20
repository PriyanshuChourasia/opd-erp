<?php

namespace Modules\Permission\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $permissions = Permission::all();

        return response()->json(['data' => $permissions]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resource' => 'required|string',
            'action' => 'required|string',
            'name' => 'required|string',
        ]);

        $permission = Permission::create($validated);

        return response()->json(['data' => $permission], 201);
    }

    public function show(string $id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        return response()->json(['data' => $permission]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        $validated = $request->validate([
            'resource' => 'sometimes|string',
            'action' => 'sometimes|string',
            'name' => 'sometimes|string',
        ]);

        $permission->update($validated);

        return response()->json(['data' => $permission]);
    }

    public function destroy(string $id): JsonResponse
    {
        Permission::findOrFail($id)->delete();

        return response()->json(['message' => 'Permission deleted successfully.']);
    }
}
