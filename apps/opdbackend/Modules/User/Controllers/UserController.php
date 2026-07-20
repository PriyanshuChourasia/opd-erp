<?php

namespace Modules\User\Controllers;

use App\Http\Controllers\Controller;
use Modules\User\Services\UserService;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index() {}
    public function store($request) {}
    public function show($id) {}
    public function update($request, $id) {}
    public function destroy($id) {}
}