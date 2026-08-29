<?php

// TEMP scaffolding generator. Run once (php Modules/_scaffold.php), then delete.

$base = dirname(__DIR__); // apps/admin-api
$modulesDir = $base . '/Modules';

$specs = [
    'Department' => [
        'table' => 'departments', 'ts' => '2026_08_29_000001', 'plural' => 'departments', 'param' => 'department',
        'search' => ['name', 'code'], 'order' => 'name', 'type' => 'full',
        'columns' => [
            ['name', 'required', 'string', 'max:255'],
            ['code', 'nullable', 'string', 'max:50', 'unique'],
            ['description', 'nullable', 'text'],
            ['status', 'nullable', 'string', 'default:active', 'in:active,inactive'],
        ],
        'fks' => [],
    ],
    'Designation' => [
        'table' => 'designations', 'ts' => '2026_08_29_000003', 'plural' => 'designations', 'param' => 'designation',
        'search' => ['name'], 'order' => 'name', 'type' => 'full',
        'columns' => [
            ['name', 'required', 'string', 'max:255'],
            ['description', 'nullable', 'text'],
            ['status', 'nullable', 'string', 'default:active', 'in:active,inactive'],
        ],
        'fks' => [['department_id', 'departments', 'required']],
    ],
    'Employee' => [
        'table' => 'employees', 'ts' => '2026_08_29_000005', 'plural' => 'employees', 'param' => 'employee',
        'search' => ['first_name', 'last_name', 'email'], 'order' => 'id', 'type' => 'full',
        'columns' => [
            ['first_name', 'required', 'string', 'max:255'],
            ['last_name', 'nullable', 'string', 'max:255'],
            ['email', 'required', 'string', 'email', 'max:255', 'unique'],
            ['phone', 'nullable', 'string', 'max:50'],
            ['gender', 'nullable', 'string', 'max:20'],
            ['date_of_joining', 'nullable', 'date'],
            ['status', 'nullable', 'string', 'default:active', 'in:active,inactive'],
        ],
        'fks' => [
            ['department_id', 'departments', 'required'],
            ['designation_id', 'designations', 'required'],
            ['user_id', 'users', 'nullable', 'unique'],
        ],
    ],
    'Role' => [
        'table' => 'roles', 'ts' => '2026_08_29_000010', 'plural' => 'roles', 'param' => 'role',
        'search' => ['name', 'slug'], 'order' => 'name', 'type' => 'full',
        'columns' => [
            ['name', 'required', 'string', 'max:100', 'unique'],
            ['slug', 'required', 'string', 'max:100', 'unique'],
            ['description', 'nullable', 'text'],
        ],
        'fks' => [],
    ],
    'Permission' => [
        'table' => 'permissions', 'ts' => '2026_08_29_000012', 'plural' => 'permissions', 'param' => 'permission',
        'search' => ['name', 'slug', 'module'], 'order' => 'name', 'type' => 'full',
        'columns' => [
            ['name', 'required', 'string', 'max:150', 'unique'],
            ['slug', 'required', 'string', 'max:150', 'unique'],
            ['module', 'nullable', 'string', 'max:100'],
            ['description', 'nullable', 'text'],
        ],
        'fks' => [],
    ],
    'ApplicationModule' => [
        'table' => 'application_modules', 'ts' => '2026_08_29_000030', 'plural' => 'application-modules', 'param' => 'applicationModule',
        'search' => ['name', 'slug'], 'order' => 'name', 'type' => 'full',
        'columns' => [
            ['name', 'required', 'string', 'max:150', 'unique'],
            ['slug', 'required', 'string', 'max:150', 'unique'],
            ['icon', 'nullable', 'string', 'max:100'],
            ['description', 'nullable', 'text'],
        ],
        'fks' => [],
    ],
    'ApplicationFeature' => [
        'table' => 'application_features', 'ts' => '2026_08_29_000031', 'plural' => 'application-features', 'param' => 'applicationFeature',
        'search' => ['name', 'slug'], 'order' => 'name', 'type' => 'full',
        'columns' => [
            ['name', 'required', 'string', 'max:150'],
            ['slug', 'required', 'string', 'max:150'],
            ['description', 'nullable', 'text'],
        ],
        'fks' => [['module_id', 'application_modules', 'required']],
    ],
    'UserRole' => [
        'table' => 'user_role', 'ts' => '2026_08_29_000020', 'plural' => 'user-roles', 'param' => 'userRole',
        'search' => [], 'order' => 'id', 'type' => 'pivot', 'columns' => [],
        'fks' => [
            ['user_id', 'users', 'required'],
            ['role_id', 'roles', 'required'],
        ],
        'related' => [
            ['key' => 'user_id', 'table' => 'users', 'cols' => ['name', 'email']],
            ['key' => 'role_id', 'table' => 'roles', 'cols' => ['name']],
        ],
    ],
    'UserPermission' => [
        'table' => 'user_permission', 'ts' => '2026_08_29_000021', 'plural' => 'user-permissions', 'param' => 'userPermission',
        'search' => [], 'order' => 'id', 'type' => 'pivot', 'columns' => [],
        'fks' => [
            ['user_id', 'users', 'required'],
            ['permission_id', 'permissions', 'required'],
        ],
        'related' => [
            ['key' => 'user_id', 'table' => 'users', 'cols' => ['name', 'email']],
            ['key' => 'permission_id', 'table' => 'permissions', 'cols' => ['name', 'slug']],
        ],
    ],
    'Customer' => [
        'table' => 'customers', 'ts' => '2026_08_29_000042', 'plural' => 'customers', 'param' => 'customer',
        'search' => ['first_name', 'last_name', 'email', 'phone'], 'order' => 'id', 'type' => 'full',
        'columns' => [
            ['first_name', 'required', 'string', 'max:255'],
            ['last_name', 'nullable', 'string', 'max:255'],
            ['email', 'required', 'string', 'email', 'max:255', 'unique'],
            ['phone', 'nullable', 'string', 'max:50'],
            ['gender', 'nullable', 'string', 'max:20'],
            ['date_of_birth', 'nullable', 'date'],
            ['address', 'nullable', 'string', 'max:255'],
            ['city', 'nullable', 'string', 'max:100'],
            ['state', 'nullable', 'string', 'max:100'],
            ['country', 'nullable', 'string', 'max:100'],
            ['pincode', 'nullable', 'string', 'max:20'],
            ['status', 'nullable', 'string', 'default:active', 'in:active,inactive'],
        ],
        'fks' => [
            ['user_id', 'users', 'nullable', 'unique'],
        ],
    ],
];

function Str_Studly(string $value): string
{
    $value = ucwords(str_replace(['-', '_'], ' ', $value));

    return str_replace(' ', '', $value);
}

$written = 0;

foreach ($specs as $name => $spec) {
    $dir = "$modulesDir/$name";
    $table = $spec['table'];
    $plural = $spec['plural'];
    $param = $spec['param'];
    $type = $spec['type'];
    $ns = "Modules\\$name";
    $lower = strtolower($name);

    // Precomputed FQCNs — interpolate these inside heredocs (never build "\\My{$name}" inline).
    $routeParam = '{' . $param . '}';
    $providerClass = "$ns\\Providers\\{$name}ServiceProvider";
    $contractClass = "$ns\\Contracts\\{$name}ServiceInterface";
    $serviceClass = "$ns\\Services\\{$name}Service";
    $controllerClass = "$ns\\Controllers\\{$name}Controller";
    $storeReqClass = "$ns\\Http\\Requests\\Store{$name}Request";
    $updateReqClass = "$ns\\Http\\Requests\\Update{$name}Request";

    $files = [];

    $files['module.json'] = json_encode([
        'name' => $name,
        'alias' => $lower,
        'description' => "$name module for the admin-api",
        'keywords' => [$lower],
        'priority' => 90,
        'providers' => [$providerClass],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

    $files['composer.json'] = json_encode([
        'name' => "nwidart/$lower",
        'description' => "$name module for the admin-api",
        'extra' => ['laravel' => ['providers' => [], 'aliases' => []]],
        'autoload' => [
            'psr-4' => [
                "$ns\\" => '',
                "$ns\\Database\\Factories\\" => 'database/factories/',
                "$ns\\Database\\Seeders\\" => 'database/seeders/',
            ],
        ],
        'autoload-dev' => ['psr-4' => ["$ns\\Tests\\" => 'tests/']],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

    $files['config/config.php'] = "<?php\n\nreturn ['name' => '$name'];\n";

    $files['Providers/' . $name . 'ServiceProvider.php'] = <<<PHP
<?php

namespace $ns\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use $contractClass;
use $serviceClass;

class {$name}ServiceProvider extends ServiceProvider
{
    protected string \$moduleName = '$name';

    protected string \$moduleNameLower = '$lower';

    public function boot(): void
    {
        \$this->registerConfig();
        \$this->loadMigrationsFrom(module_path(\$this->moduleName, 'database/migrations'));
        \$this->registerRoutes();
    }

    public function register(): void
    {
        \$this->app->singleton({$name}ServiceInterface::class, {$name}Service::class);
    }

    protected function registerConfig(): void
    {
        \$this->publishes([
            module_path(\$this->moduleName, 'config/config.php') => config_path(\$this->moduleNameLower . '.php'),
        ], 'config');

        \$this->mergeConfigFrom(
            module_path(\$this->moduleName, 'config/config.php'),
            \$this->moduleNameLower
        );
    }

    protected function registerRoutes(): void
    {
        Route::middleware('api')
            ->prefix('api')
            ->group(module_path(\$this->moduleName, 'routes/api.php'));
    }
}
PHP;

    $files['Contracts/' . $name . 'ServiceInterface.php'] = ($type === 'pivot' ? <<<PHP
<?php

namespace $ns\Contracts;

use Illuminate\Http\Request;
use $storeReqClass;

interface {$name}ServiceInterface
{
    public function index(Request \$request): array;

    public function store(Store{$name}Request \$request): array;

    public function destroy(int \$id): void;
}
PHP : <<<PHP
<?php

namespace $ns\Contracts;

use Illuminate\Http\Request;
use $storeReqClass;
use $updateReqClass;

interface {$name}ServiceInterface
{
    public function index(Request \$request): array;

    public function show(int \$id): array;

    public function store(Store{$name}Request \$request): array;

    public function update(int \$id, Update{$name}Request \$request): array;

    public function destroy(int \$id): void;
}
PHP);

    $files['Controllers/' . $name . 'Controller.php'] = ($type === 'pivot' ? <<<PHP
<?php

namespace $ns\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use $serviceClass;
use $storeReqClass;

class {$name}Controller
{
    public function __construct(private readonly {$name}Service \$service)
    {
    }

    public function index(Request \$request): JsonResponse
    {
        return response()->json(\$this->service->index(\$request));
    }

    public function store(Store{$name}Request \$request): JsonResponse
    {
        return response()->json(\$this->service->store(\$request), 201);
    }

    public function destroy(int \$id): JsonResponse
    {
        \$this->service->destroy(\$id);

        return response()->json(null, 204);
    }
}
PHP : <<<PHP
<?php

namespace $ns\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use $serviceClass;
use $storeReqClass;
use $updateReqClass;

class {$name}Controller
{
    public function __construct(private readonly {$name}Service \$service)
    {
    }

    public function index(Request \$request): JsonResponse
    {
        return response()->json(\$this->service->index(\$request));
    }

    public function store(Store{$name}Request \$request): JsonResponse
    {
        return response()->json(\$this->service->store(\$request), 201);
    }

    public function show(int \$id): JsonResponse
    {
        return response()->json(\$this->service->show(\$id));
    }

    public function update(int \$id, Update{$name}Request \$request): JsonResponse
    {
        return response()->json(\$this->service->update(\$id, \$request));
    }

    public function destroy(int \$id): JsonResponse
    {
        \$this->service->destroy(\$id);

        return response()->json(null, 204);
    }
}
PHP);

    $files['routes/api.php'] = ($type === 'pivot' ? <<<PHP
<?php

use Illuminate\Support\Facades\Route;
use $controllerClass;

Route::middleware('auth:jwt')->prefix('$plural')->group(function () {
    Route::get('/', [{$name}Controller::class, 'index']);
    Route::post('/', [{$name}Controller::class, 'store']);
    Route::delete('$routeParam', [{$name}Controller::class, 'destroy'])->whereNumber('$param');
});
PHP : <<<PHP
<?php

use Illuminate\Support\Facades\Route;
use $controllerClass;

Route::middleware('auth:jwt')->prefix('$plural')->group(function () {
    Route::get('/', [{$name}Controller::class, 'index']);
    Route::post('/', [{$name}Controller::class, 'store']);
    Route::get('$routeParam', [{$name}Controller::class, 'show'])->whereNumber('$param');
    Route::put('$routeParam', [{$name}Controller::class, 'update'])->whereNumber('$param');
    Route::delete('$routeParam', [{$name}Controller::class, 'destroy'])->whereNumber('$param');
});
PHP);

    // ---- Migration ----
    $migrationBody = '        $table->id();' . PHP_EOL;
    foreach ($spec['columns'] as $entry) {
        $col = $entry[0];
        $flags = array_slice($entry, 1);
        $nullable = in_array('nullable', $flags, true);
        $unique = in_array('unique', $flags, true);
        $max = null;
        $default = null;
        foreach ($flags as $f) {
            if (str_starts_with($f, 'max:')) $max = (int) substr($f, 4);
            if (str_starts_with($f, 'default:')) $default = substr($f, 8);
        }
        if (in_array('text', $flags, true)) {
            $line = "\$table->text('$col')";
        } elseif (in_array('date', $flags, true)) {
            $line = "\$table->date('$col')";
        } else {
            $line = $max ? "\$table->string('$col', $max)" : "\$table->string('$col')";
        }
        if ($nullable) $line .= '->nullable()';
        if ($unique) $line .= '->unique()';
        if ($default !== null) $line .= "->default('$default')";
        $migrationBody .= "        $line;" . PHP_EOL;
    }
    foreach ($spec['fks'] as $fkEntry) {
        $fk = $fkEntry[0];
        $target = $fkEntry[1];
        $flags = array_slice($fkEntry, 2);
        $nullable = in_array('nullable', $flags, true);
        $unique = in_array('unique', $flags, true);
        $line = "\$table->foreignId('$fk')";
        if ($nullable) $line .= '->nullable()';
        if ($unique) $line .= '->unique()';
        $migrationBody .= "        {$line}->constrained('$target')->cascadeOnDelete();" . PHP_EOL;
    }
    $migrationBody .= '        $table->timestamps();' . PHP_EOL;
    if ($type === 'pivot') {
        $pivotKeys = implode("', '", array_map(fn ($f) => $f[0], $spec['fks']));
        $migrationBody .= "        \$table->unique(['$pivotKeys']);" . PHP_EOL;
    }

    $files['database/migrations/' . $spec['ts'] . '_create_' . $table . '_table.php'] = <<<PHP
<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('$table', function (Blueprint \$table) {
            $migrationBody        });
    }

    public function down(): void
    {
        Schema::dropIfExists('$table');
    }
};
PHP;

    // ---- Requests ----
    $buildRules = function (array $columns, array $fks, bool $update, string $table, string $param): string {
        $lines = [];
        foreach ($columns as $entry) {
            $col = $entry[0];
            $flags = array_slice($entry, 1);
            $required = in_array('required', $flags, true) && !$update;
            $rules = [$required ? "'required'" : "'nullable'"];
            if (in_array('string', $flags, true)) {
                $rules[] = "'string'";
                foreach ($flags as $f) {
                    if (str_starts_with($f, 'max:')) $rules[] = "'max:" . substr($f, 4) . "'";
                }
            } elseif (in_array('date', $flags, true)) {
                $rules[] = "'date'";
            }
            if (in_array('email', $flags, true)) $rules[] = "'email'";
            if (in_array('unique', $flags, true)) {
                $rules[] = "Rule::unique('$table', '$col')" . ($update ? "->ignore(\$this->route('$param'))" : '');
            }
            foreach ($flags as $f) {
                if (str_starts_with($f, 'in:')) {
                    $values = implode("', '", explode(',', substr($f, 3)));
                    $rules[] = "Rule::in(['$values'])";
                }
            }
            $lines[] = "            '$col' => [" . implode(', ', $rules) . '],';
        }
        foreach ($fks as $fkEntry) {
            $fk = $fkEntry[0];
            $target = $fkEntry[1];
            $flags = array_slice($fkEntry, 2);
            $required = in_array('required', $flags, true) && !$update;
            $rules = [$required ? "'required'" : "'nullable'", "Rule::exists('$target', 'id')"];
            if (in_array('unique', $flags, true)) {
                $rules[] = "Rule::unique('$table', '$fk')" . ($update ? "->ignore(\$this->route('$param'))" : '');
            }
            $lines[] = "            '$fk' => [" . implode(', ', $rules) . '],';
        }

        return implode(PHP_EOL, $lines);
    };

    if ($type === 'pivot') {
        $storeRules = [];
        foreach ($spec['fks'] as $fkEntry) {
            $fk = $fkEntry[0];
            $target = $fkEntry[1];
            $storeRules[] = "            '$fk' => ['required', 'integer', Rule::exists('$target', 'id')],";
        }
        $storeRules = implode(PHP_EOL, $storeRules);

        $files['Http/Requests/Store' . $name . 'Request.php'] = <<<PHP
<?php

namespace $ns\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class Store{$name}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
$storeRules
        ];
    }
}
PHP;
    } else {
        $storeRules = $buildRules($spec['columns'], $spec['fks'], false, $table, $param);
        $updateRules = $buildRules($spec['columns'], $spec['fks'], true, $table, $param);

        $files['Http/Requests/Store' . $name . 'Request.php'] = <<<PHP
<?php

namespace $ns\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class Store{$name}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
$storeRules
        ];
    }
}
PHP;

        $files['Http/Requests/Update' . $name . 'Request.php'] = <<<PHP
<?php

namespace $ns\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class Update{$name}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
$updateRules
        ];
    }
}
PHP;
    }

    // ---- Service ----
    if ($type === 'pivot') {
        $selects = ["$table.id", "$table.user_id"];
        $mapChunks = ["            'id' => (string) \$row->id,"];
        $relSubChunks = [];
        foreach ($spec['related'] as $rel) {
            $relName = str_replace('_id', '', $rel['key']);
            $selects[] = "$table.{$rel['key']}";
            $relMap = ["'id' => (string) \$row->{$rel['key']},"];
            foreach ($rel['cols'] as $c) {
                $selects[] = "{$rel['table']}.$c as {$rel['key']}___{$c}";
                $relMap[] = "'$c' => \$row->{$rel['key']}___{$c},";
            }
            $relSubChunks[] = "            '$relName' => [" . PHP_EOL . "                " . implode(PHP_EOL . "                ", $relMap) . PHP_EOL . "            ],";
        }
        $selectListStr = implode(', ', array_map(fn ($s) => "'$s'", $selects));
        $mapBody = implode(PHP_EOL, array_merge($mapChunks, $relSubChunks));
        $chain = '';
        foreach ($spec['related'] as $rel) {
            $chain .= "            ->leftJoin('{$rel['table']}', '$table.{$rel['key']}', '=', '{$rel['table']}.id')" . PHP_EOL;
        }
        $firstFk = $spec['fks'][0][0];
        $secondFk = $spec['fks'][1][0];

        $files['Services/' . $name . 'Service.php'] = <<<PHP
<?php

namespace $ns\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use $contractClass;
use $storeReqClass;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class {$name}Service implements {$name}ServiceInterface
{
    private string \$table = '$table';

    public function index(Request \$request): array
    {
        \$limit = min(max((int) \$request->input('limit', 10), 1), 100);
        \$page = max((int) \$request->input('page', 1), 1);

        \$query = DB::table(\$this->table)
$chain            ->select([$selectListStr]);

        if (\$userId = \$request->input('user_id')) {
            \$query->where(\$this->table . '.user_id', (int) \$userId);
        }

        \$paginator = \$query->orderByDesc(\$this->table . '.id')->paginate(\$limit, ['*'], 'page', \$page);

        return [
            'data' => collect(\$paginator->items())->map(function (\$row) {
                return [
$mapBody
                ];
            })->values(),
            'meta' => [
                'total' => \$paginator->total(),
                'page' => \$paginator->currentPage(),
                'limit' => \$paginator->perPage(),
                'totalPages' => \$paginator->lastPage(),
            ],
        ];
    }

    public function store(Store{$name}Request \$request): array
    {
        \$data = \$request->validated();

        \$exists = DB::table(\$this->table)
            ->where('$firstFk', \$data['$firstFk'])
            ->where('$secondFk', \$data['$secondFk'])
            ->exists();

        if (\$exists) {
            throw new HttpException(422, 'This assignment already exists.');
        }

        \$id = DB::table(\$this->table)->insertGetId(array_merge(\$data, [
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return \$this->getById(\$id);
    }

    public function destroy(int \$id): void
    {
        \$row = DB::table(\$this->table)->find(\$id);
        if (! \$row) {
            throw new NotFoundHttpException();
        }
        DB::table(\$this->table)->where('id', \$id)->delete();
    }

    private function getById(int \$id): array
    {
        \$row = DB::table(\$this->table)->find(\$id);
        if (! \$row) {
            throw new NotFoundHttpException();
        }

        return [
            'id' => (string) \$row->id,
            '$firstFk' => (string) \$row->$firstFk,
            '$secondFk' => (string) \$row->$secondFk,
        ];
    }
}
PHP;
    } else {
        $searchFields = '';
        foreach ($spec['search'] as $i => $col) {
            $op = $i === 0 ? 'where' : 'orWhere';
            $searchFields .= "                    \$q->$op('$col', 'like', \"%\$search%\");" . PHP_EOL;
        }
        $order = $spec['order'];

        $files['Services/' . $name . 'Service.php'] = <<<PHP
<?php

namespace $ns\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use $contractClass;
use $storeReqClass;
use $updateReqClass;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class {$name}Service implements {$name}ServiceInterface
{
    private string \$table = '$table';

    public function index(Request \$request): array
    {
        \$limit = min(max((int) \$request->input('limit', 10), 1), 100);
        \$page = max((int) \$request->input('page', 1), 1);

        \$query = DB::table(\$this->table);

        \$search = trim((string) \$request->input('search', ''));
        if (\$search !== '') {
            \$query->where(function (\$q) use (\$search) {
$searchFields            });
        }

        \$paginator = \$query->orderBy('$order')->paginate(\$limit, ['*'], 'page', \$page);

        return [
            'data' => collect(\$paginator->items())->values(),
            'meta' => [
                'total' => \$paginator->total(),
                'page' => \$paginator->currentPage(),
                'limit' => \$paginator->perPage(),
                'totalPages' => \$paginator->lastPage(),
            ],
        ];
    }

    public function show(int \$id): array
    {
        return \$this->getById(\$id);
    }

    public function store(Store{$name}Request \$request): array
    {
        \$id = DB::table(\$this->table)->insertGetId(array_merge(\$request->validated(), [
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return \$this->getById(\$id);
    }

    public function update(int \$id, Update{$name}Request \$request): array
    {
        \$row = DB::table(\$this->table)->find(\$id);
        if (! \$row) {
            throw new NotFoundHttpException();
        }

        DB::table(\$this->table)
            ->where('id', \$id)
            ->update(array_merge(\$request->validated(), ['updated_at' => now()]));

        return \$this->getById(\$id);
    }

    public function destroy(int \$id): void
    {
        \$row = DB::table(\$this->table)->find(\$id);
        if (! \$row) {
            throw new NotFoundHttpException();
        }
        DB::table(\$this->table)->where('id', \$id)->delete();
    }

    private function getById(int \$id): array
    {
        \$row = DB::table(\$this->table)->find(\$id);
        if (! \$row) {
            throw new NotFoundHttpException();
        }

        return (array) \$row;
    }
}
PHP;
    }

    foreach ($files as $relative => $content) {
        $path = "$dir/$relative";
        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }
        file_put_contents($path, $content);
        $written++;
    }
}

// Enable all new modules in modules_statuses.json
$statusesPath = "$base/modules_statuses.json";
$statuses = json_decode(file_get_contents($statusesPath), true) ?: [];
foreach (array_keys($specs) as $name) {
    $statuses[$name] = true;
}
file_put_contents($statusesPath, json_encode($statuses, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);

echo "Generated $written files across " . count($specs) . " modules.\n";