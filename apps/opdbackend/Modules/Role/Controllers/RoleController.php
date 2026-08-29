<?php

namespace Modules\Role\Controllers;

use App\Http\Controllers\Controller;
use Modules\Role\Services\RoleService;

class RoleController extends Controller
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    public function index() {}
    public function store($request) {}
    public function show($id) {}
    public function update($request, $id) {}
    public function destroy($id) {}
}