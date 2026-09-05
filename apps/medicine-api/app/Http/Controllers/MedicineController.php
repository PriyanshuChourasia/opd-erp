<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Medicine::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('brand_name', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = min((int) $request->query('limit', 20), 100);
        $page = (int) $request->query('page', 1);

        $medicines = $query->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $medicines->items(),
            'meta' => [
                'total' => $medicines->total(),
                'page' => $medicines->currentPage(),
                'limit' => $perPage,
                'totalPages' => $medicines->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'brand_name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'strength' => 'nullable|string|max:255',
            'unit' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $medicine = Medicine::create($validated);

        return response()->json($medicine, 201);
    }

    public function show(string $id): JsonResponse
    {
        $medicine = Medicine::findOrFail($id);

        return response()->json($medicine);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $medicine = Medicine::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'brand_name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
            'strength' => 'nullable|string|max:255',
            'unit' => 'sometimes|required|string|max:50',
            'price' => 'sometimes|required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $medicine->update($validated);

        return response()->json($medicine);
    }

    public function destroy(string $id): JsonResponse
    {
        $medicine = Medicine::findOrFail($id);
        $medicine->delete();

        return response()->json(null, 204);
    }
}
