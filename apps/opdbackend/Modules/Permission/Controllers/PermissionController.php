<?php

namespace Modules\Permission\Controllers;

use App\Http\Controllers\Controller;
use Modules\Permission\Services\PermissionService;

class PermissionController extends Controller
{
    public function __construct(
        protected PermissionService $permissionService
    ) {}

    public function index() {}
    public function store($request) {}
    public function show($id) {}
    public function update($request, $id) {}
    public function destroy($id) {}
}