<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ModuleMakeCustomCommand extends Command
{
    protected $signature = 'module:make-custom {name} {--no-migration} {--no-seeder} {--no-factory}';

    protected $description = 'Create a new module with full structure: Controllers, Services, Repositories, Interfaces, Contracts, Requests, Resources, Models, Providers, Helpers, Enums, Middleware, Routes, Tests';

    public function handle(): int
    {
        $name = $this->argument('name');
        $studlyName = Str::studly($name);
        $lowerName = Str::lower($name);
        $pluralName = Str::plural($lowerName);
        $modulePath = base_path("Modules/{$studlyName}");
        $migrationDate = now()->format('Y_m_d_His');

        if (is_dir($modulePath)) {
            $this->error("Module [{$studlyName}] already exists.");
            return 1;
        }

        $this->info("Creating module: {$studlyName}");

        $this->call('module:make', ['name' => [$name]]);

        if (!is_dir($modulePath)) {
            $this->error("Failed to create module [{$studlyName}].");
            return 1;
        }

        $directories = [
            'Controllers',
            'Controllers/Api',
            'Middleware',
            'Services',
            'Repositories',
            'Interfaces',
            'Contracts',
            'Requests',
            'Resources',
            'Models',
            'Providers',
            'Helpers',
            'Enums',
            'Events',
            'Listeners',
            'Observers',
            'Traits',
            'Actions',
            'Jobs',
            'config',
            'database/factories',
            'database/migrations',
            'database/seeders',
            'Routes',
            'resources/views',
            'tests/Unit',
            'tests/Feature',
        ];

        foreach ($directories as $dir) {
            $fullPath = "{$modulePath}/{$dir}";
            if (!is_dir($fullPath)) {
                mkdir($fullPath, 0755, true);
            }
        }

        file_put_contents("{$modulePath}/Providers/{$studlyName}ServiceProvider.php", $this->stubServiceProvider($studlyName, $lowerName));
        file_put_contents("{$modulePath}/Providers/RouteServiceProvider.php", $this->stubRouteServiceProvider($studlyName, $lowerName));
        file_put_contents("{$modulePath}/Models/{$studlyName}.php", $this->stubModel($studlyName, $lowerName));
        file_put_contents("{$modulePath}/Controllers/{$studlyName}Controller.php", $this->stubController($studlyName, $lowerName));
        file_put_contents("{$modulePath}/Controllers/Api/{$studlyName}Controller.php", $this->stubApiController($studlyName, $lowerName));
        file_put_contents("{$modulePath}/Interfaces/{$studlyName}RepositoryInterface.php", $this->stubRepositoryInterface($studlyName));
        file_put_contents("{$modulePath}/Contracts/{$studlyName}ServiceInterface.php", $this->stubServiceInterface($studlyName));
        file_put_contents("{$modulePath}/Repositories/{$studlyName}Repository.php", $this->stubRepository($studlyName, $lowerName));
        file_put_contents("{$modulePath}/Services/{$studlyName}Service.php", $this->stubService($studlyName, $lowerName));
        file_put_contents("{$modulePath}/Requests/Store{$studlyName}Request.php", $this->stubStoreRequest($studlyName));
        file_put_contents("{$modulePath}/Requests/Update{$studlyName}Request.php", $this->stubUpdateRequest($studlyName));
        file_put_contents("{$modulePath}/Resources/{$studlyName}Resource.php", $this->stubResource($studlyName));
        file_put_contents("{$modulePath}/Middleware/{$studlyName}Middleware.php", $this->stubMiddleware($studlyName));
        file_put_contents("{$modulePath}/Routes/api.php", $this->stubApiRoutes($studlyName, $pluralName));
        file_put_contents("{$modulePath}/Routes/web.php", $this->stubWebRoutes($studlyName, $lowerName));
        file_put_contents("{$modulePath}/tests/Unit/{$studlyName}Test.php", $this->stubUnitTest($studlyName));

        if (!$this->option('no-migration')) {
            $migrationDate = now()->format('Y_m_d_His');
            file_put_contents("{$modulePath}/database/migrations/{$migrationDate}_create_{$pluralName}_table.php", $this->stubMigration($pluralName));
        }

        if (!$this->option('no-seeder')) {
            file_put_contents("{$modulePath}/database/seeders/{$studlyName}Seeder.php", $this->stubSeeder($studlyName));
        }

        if (!$this->option('no-factory')) {
            file_put_contents("{$modulePath}/database/factories/{$studlyName}Factory.php", $this->stubFactory($studlyName));
        }

        $moduleJsonPath = "{$modulePath}/module.json";
        if (file_exists($moduleJsonPath)) {
            $moduleJson = json_decode(file_get_contents($moduleJsonPath), true);
            $moduleJson['providers'] = [
                "Modules\\{$studlyName}\\Providers\\{$studlyName}ServiceProvider",
                "Modules\\{$studlyName}\\Providers\\RouteServiceProvider",
            ];
            file_put_contents($moduleJsonPath, json_encode($moduleJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }

        $moduleComposerPath = "{$modulePath}/composer.json";
        if (file_exists($moduleComposerPath)) {
            $composer = json_decode(file_get_contents($moduleComposerPath), true);
            $composer['autoload'] = [
                'psr-4' => [
                    "Modules\\{$studlyName}\\" => '',
                    "Modules\\{$studlyName}\\Database\\Factories\\" => 'database/factories/',
                    "Modules\\{$studlyName}\\Database\\Seeders\\" => 'database/seeders/',
                ],
            ];
            $composer['autoload-dev'] = [
                'psr-4' => [
                    "Modules\\{$studlyName}\\Tests\\" => 'tests/',
                ],
            ];
            file_put_contents($moduleComposerPath, json_encode($composer, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }

        $this->call('module:dump', ['--no-interaction' => true]);

        $this->newLine();
        $this->info("Module [{$studlyName}] created successfully!");
        $this->newLine();

        $this->info("Module structure:");
        $this->line("  Modules/{$studlyName}/");
        $this->line("  ├── Controllers/");
        $this->line("  │   ├── Api/");
        $this->line("  │   │   └── {$studlyName}Controller.php");
        $this->line("  │   └── {$studlyName}Controller.php");
        $this->line("  ├── Contracts/");
        $this->line("  │   └── {$studlyName}ServiceInterface.php");
        $this->line("  ├── Enums/");
        $this->line("  ├── Events/");
        $this->line("  ├── Helpers/");
        $this->line("  ├── Interfaces/");
        $this->line("  │   └── {$studlyName}RepositoryInterface.php");
        $this->line("  ├── Jobs/");
        $this->line("  ├── Listeners/");
        $this->line("  ├── Middleware/");
        $this->line("  │   └── {$studlyName}Middleware.php");
        $this->line("  ├── Models/");
        $this->line("  │   └── {$studlyName}.php");
        $this->line("  ├── Observers/");
        $this->line("  ├── Providers/");
        $this->line("  │   ├── {$studlyName}ServiceProvider.php");
        $this->line("  │   └── RouteServiceProvider.php");
        $this->line("  ├── Repositories/");
        $this->line("  │   └── {$studlyName}Repository.php");
        $this->line("  ├── Requests/");
        $this->line("  │   ├── Store{$studlyName}Request.php");
        $this->line("  │   └── Update{$studlyName}Request.php");
        $this->line("  ├── Resources/");
        $this->line("  │   └── {$studlyName}Resource.php");
        $this->line("  ├── Routes/");
        $this->line("  │   ├── api.php");
        $this->line("  │   └── web.php");
        $this->line("  ├── Services/");
        $this->line("  │   └── {$studlyName}Service.php");
        $this->line("  ├── Traits/");
        $this->line("  ├── config/");
        $this->line("  ├── database/");
        $this->line("  │   ├── factories/");
        $this->line("  │   │   └── {$studlyName}Factory.php");
        $this->line("  │   ├── migrations/");
        if (!$this->option('no-migration')) {
            $this->line("  │   │   └── {$migrationDate}_create_{$pluralName}_table.php");
        }
        $this->line("  │   └── seeders/");
        $this->line("  │       └── {$studlyName}Seeder.php");
        $this->line("  ├── resources/");
        $this->line("  │   └── views/");
        $this->line("  ├── tests/");
        $this->line("  │   ├── Unit/");
        $this->line("  │   │   └── {$studlyName}Test.php");
        $this->line("  │   └── Feature/");
        $this->line("  ├── composer.json");
        $this->line("  └── module.json");
        $this->newLine();

        return 0;
    }

    private function stubServiceProvider(string $s, string $l): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Providers;

use Illuminate\Support\ServiceProvider;

class {$s}ServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        \$this->app->bind(
            \Modules\\{$s}\\Interfaces\\{$s}RepositoryInterface::class,
            \Modules\\{$s}\\Repositories\\{$s}Repository::class
        );

        \$this->app->bind(
            \Modules\\{$s}\\Contracts\\{$s}ServiceInterface::class,
            \Modules\\{$s}\\Services\\{$s}Service::class
        );
    }

    public function boot(): void
    {
        \$this->loadRoutesFrom(__DIR__.'/../Routes/api.php');
        \$this->loadRoutesFrom(__DIR__.'/../Routes/web.php');
        \$this->loadViewsFrom(__DIR__.'/../resources/views', '{$l}');
        \$this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }
}
PHP;
    }

    private function stubRouteServiceProvider(string $s, string $l): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public const HOME = '/{$l}';

    public function boot(): void
    {
        \$this->routes(function () {
            Route::middleware('api')
                ->prefix('api/v1/{$l}')
                ->namespace('Modules\\{$s}\\Controllers\\Api')
                ->group(__DIR__.'/../Routes/api.php');

            Route::middleware('web')
                ->namespace('Modules\\{$s}\\Controllers')
                ->group(__DIR__.'/../Routes/web.php');
        });
    }
}
PHP;
    }

    private function stubModel(string $s, string $l): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class {$s} extends Model
{
    use HasFactory;

    protected \$table = '{$l}';
    protected \$fillable = [];
    protected \$casts = [];
}
PHP;
    }

    private function stubController(string $s, string $l): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Controllers;

use App\Http\Controllers\Controller;
use Modules\\{$s}\\Services\\{$s}Service;

class {$s}Controller extends Controller
{
    public function __construct(
        protected {$s}Service \${$l}Service
    ) {}

    public function index() {}
    public function store(\$request) {}
    public function show(\$id) {}
    public function update(\$request, \$id) {}
    public function destroy(\$id) {}
}
PHP;
    }

    private function stubApiController(string $s, string $l): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Controllers\\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\\{$s}\\Requests\\Store{$s}Request;
use Modules\\{$s}\\Requests\\Update{$s}Request;
use Modules\\{$s}\\Resources\\{$s}Resource;
use Modules\\{$s}\\Services\\{$s}Service;

class {$s}Controller extends Controller
{
    public function __construct(
        protected {$s}Service \${$l}Service
    ) {}

    public function index(Request \$request): JsonResponse
    {
        \$items = \$this->{$l}Service->paginate(\$request->only([
            'search', 'per_page', 'sort_by', 'sort_order',
        ]));

        return response()->json([
            'data' => {$s}Resource::collection(\$items),
            'total' => \$items->total(),
            'page' => \$items->currentPage(),
            'limit' => \$items->perPage(),
        ]);
    }

    public function store(Store{$s}Request \$request): JsonResponse
    {
        \$item = \$this->{$l}Service->create(\$request->validated());

        return response()->json([
            'data' => new {$s}Resource(\$item),
        ], 201);
    }

    public function show(\$id): JsonResponse
    {
        \$item = \$this->{$l}Service->findById(\$id);

        return response()->json([
            'data' => new {$s}Resource(\$item),
        ]);
    }

    public function update(Update{$s}Request \$request, \$id): JsonResponse
    {
        \$item = \$this->{$l}Service->update(\$id, \$request->validated());

        return response()->json([
            'data' => new {$s}Resource(\$item),
        ]);
    }

    public function destroy(\$id): JsonResponse
    {
        \$this->{$l}Service->delete(\$id);

        return response()->json([
            'message' => '{$s} deleted successfully.',
        ]);
    }
}
PHP;
    }

    private function stubRepositoryInterface(string $s): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Interfaces;

use Modules\\{$s}\\Models\\{$s};

interface {$s}RepositoryInterface
{
    public function all(array \$filters = [], string \$sortBy = 'id', string \$sortOrder = 'desc', int \$perPage = 15);
    public function findById(int \$id): {$s};
    public function create(array \$data): {$s};
    public function update(int \$id, array \$data): {$s};
    public function delete(int \$id): bool;
}
PHP;
    }

    private function stubServiceInterface(string $s): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\\{$s}\\Models\\{$s};

interface {$s}ServiceInterface
{
    public function paginate(array \$filters = [], string \$sortBy = 'id', string \$sortOrder = 'desc', int \$perPage = 15): LengthAwarePaginator;
    public function findById(int \$id): {$s};
    public function create(array \$data): {$s};
    public function update(int \$id, array \$data): {$s};
    public function delete(int \$id): bool;
}
PHP;
    }

    private function stubRepository(string $s, string $l): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Modules\\{$s}\\Interfaces\\{$s}RepositoryInterface;
use Modules\\{$s}\\Models\\{$s};

class {$s}Repository implements {$s}RepositoryInterface
{
    public function __construct(
        protected {$s} \$model
    ) {}

    public function all(array \$filters = [], string \$sortBy = 'id', string \$sortOrder = 'desc', int \$perPage = 15): LengthAwarePaginator
    {
        \$query = \$this->model->newQuery();

        if (isset(\$filters['search']) && \$filters['search'] !== '') {
            \$search = \$filters['search'];
            \$query->where(function (Builder \$q) use (\$search) {
                \$q->where('id', 'like', "%{\$search}%");
            });
        }

        return \$query->orderBy(\$sortBy, \$sortOrder)->paginate(\$perPage);
    }

    public function findById(int \$id): {$s}
    {
        return \$this->model->findOrFail(\$id);
    }

    public function create(array \$data): {$s}
    {
        return \$this->model->create(\$data);
    }

    public function update(int \$id, array \$data): {$s}
    {
        \$item = \$this->findById(\$id);
        \$item->update(\$data);
        return \$item->fresh();
    }

    public function delete(int \$id): bool
    {
        return \$this->findById(\$id)->delete();
    }
}
PHP;
    }

    private function stubService(string $s, string $l): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\\{$s}\\Contracts\\{$s}ServiceInterface;
use Modules\\{$s}\\Interfaces\\{$s}RepositoryInterface;
use Modules\\{$s}\\Models\\{$s};

class {$s}Service implements {$s}ServiceInterface
{
    public function __construct(
        protected {$s}RepositoryInterface \${$l}Repository
    ) {}

    public function paginate(array \$filters = [], string \$sortBy = 'id', string \$sortOrder = 'desc', int \$perPage = 15): LengthAwarePaginator
    {
        return \$this->{$l}Repository->all(\$filters, \$sortBy, \$sortOrder, \$perPage);
    }

    public function findById(int \$id): {$s}
    {
        return \$this->{$l}Repository->findById(\$id);
    }

    public function create(array \$data): {$s}
    {
        return \$this->{$l}Repository->create(\$data);
    }

    public function update(int \$id, array \$data): {$s}
    {
        return \$this->{$l}Repository->update(\$id, \$data);
    }

    public function delete(int \$id): bool
    {
        return \$this->{$l}Repository->delete(\$id);
    }
}
PHP;
    }

    private function stubStoreRequest(string $s): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Requests;

use Illuminate\Foundation\Http\FormRequest;

class Store{$s}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            //
        ];
    }
}
PHP;
    }

    private function stubUpdateRequest(string $s): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Requests;

use Illuminate\Foundation\Http\FormRequest;

class Update{$s}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            //
        ];
    }
}
PHP;
    }

    private function stubResource(string $s): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class {$s}Resource extends JsonResource
{
    public function toArray(Request \$request): array
    {
        return [
            'id' => \$this->id,
        ];
    }
}
PHP;
    }

    private function stubMigration(string $plural): string
    {
        $table = Str::snake($plural);
        return <<<PHP
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('{$table}', function (Blueprint \$table) {
            \$table->id();
            \$table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('{$table}');
    }
};
PHP;
    }

    private function stubSeeder(string $s): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Database\\Seeders;

use Illuminate\Database\Seeder;

class {$s}Seeder extends Seeder
{
    public function run(): void
    {
        //
    }
}
PHP;
    }

    private function stubFactory(string $s): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Database\\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\\{$s}\\Models\\{$s};

class {$s}Factory extends Factory
{
    protected \$model = {$s}::class;

    public function definition(): array
    {
        return [
            //
        ];
    }
}
PHP;
    }

    private function stubUnitTest(string $s): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Tests\\Unit;

use Tests\TestCase;

class {$s}Test extends TestCase
{
    public function test_example(): void
    {
        \$this->assertTrue(true);
    }
}
PHP;
    }

    private function stubMiddleware(string $s): string
    {
        return <<<PHP
<?php

namespace Modules\\{$s}\\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class {$s}Middleware
{
    public function handle(Request \$request, Closure \$next): Response
    {
        return \$next(\$request);
    }
}
PHP;
    }

    private function stubApiRoutes(string $s, string $plural): string
    {
        return <<<PHP
<?php

use Illuminate\Support\Facades\Route;
use Modules\\{$s}\\Controllers\\Api\\{$s}Controller;

Route::apiResource('{$plural}', {$s}Controller::class);
PHP;
    }

    private function stubWebRoutes(string $s, string $l): string
    {
        return <<<PHP
<?php

use Illuminate\Support\Facades\Route;
use Modules\\{$s}\\Controllers\\{$s}Controller;

Route::resource('{$l}', {$s}Controller::class);
PHP;
    }
}
