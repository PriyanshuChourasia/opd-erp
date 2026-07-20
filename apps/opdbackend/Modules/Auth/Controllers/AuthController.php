<?php

namespace Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use Modules\Auth\Services\AuthService;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function index() {}
    public function store($request) {}
    public function show($id) {}
    public function update($request, $id) {}
    public function destroy($id) {}
}