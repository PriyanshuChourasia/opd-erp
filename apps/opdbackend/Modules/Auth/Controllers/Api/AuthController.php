<?php

namespace Modules\Auth\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Modules\User\Models\User;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|min:3|unique:users,username',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile_number' => 'nullable|string|max:20',
            'country_code' => 'nullable|string|max:5',
            'gender' => 'nullable|string|in:MALE,FEMALE,OTHER',
            'date_of_birth' => 'nullable|date',
            'qualification' => 'nullable|string|max:255',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['role_id'] = \Modules\Role\Models\Role::where('name', 'Assistant')->first()->id;

        $user = User::create($validated);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'data' => [
                'accessToken' => $token,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'email' => $user->email,
                    'roleName' => $user->role->name,
                    'permissions' => $user->permissions,
                ],
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required_without:username|email',
            'username' => 'required_without:email|string',
            'password' => 'required|string',
        ]);

        $credentials = $request->has('email')
            ? ['email' => $request->email, 'password' => $request->password]
            : ['username' => $request->username, 'password' => $request->password];

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        if (!$user->is_active) {
            return response()->json(['message' => 'Account is deactivated.'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'data' => [
                'accessToken' => $token,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'firstName' => $user->first_name,
                    'lastName' => $user->last_name,
                    'email' => $user->email,
                    'roleName' => $user->role->name,
                    'permissions' => $user->permissions,
                    'userableType' => $user->userable_type,
                    'userableId' => $user->userable_id,
                ],
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'firstName' => $user->first_name,
                'middleName' => $user->middle_name,
                'lastName' => $user->last_name,
                'email' => $user->email,
                'gender' => $user->gender,
                'dateOfBirth' => $user->date_of_birth,
                'mobileNumber' => $user->mobile_number,
                'countryCode' => $user->country_code,
                'profilePhotoUrl' => $user->profile_photo_url,
                'qualification' => $user->qualification,
                'roleName' => $user->role->name,
                'permissions' => $user->permissions,
                'userableType' => $user->userable_type,
                'userableId' => $user->userable_id,
                'createdAt' => $user->created_at,
            ],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
            'mobile_number' => 'nullable|string|max:20',
            'country_code' => 'nullable|string|max:5',
            'gender' => 'nullable|string|in:MALE,FEMALE,OTHER',
            'date_of_birth' => 'nullable|date',
            'profile_photo_url' => 'nullable|string|max:500',
            'qualification' => 'nullable|string|max:255',
        ]);

        $request->user()->update($validated);

        return response()->json([
            'data' => [
                'id' => $request->user()->id,
                'firstName' => $request->user()->first_name,
                'lastName' => $request->user()->last_name,
                'email' => $request->user()->email,
            ],
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $request->user()->update(['password' => Hash::make($request->new_password)]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }
}
