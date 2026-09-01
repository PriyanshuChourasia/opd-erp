<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * The test suite boots into the `testing` environment and connects to the
     * dedicated MySQL test database (migrations use MySQL-native DDL such as
     * `DEFAULT (UUID())`, so the in-memory sqlite default is not used here).
     */
    public function test_application_boots_in_testing_environment(): void
    {
        $this->assertSame('testing', app()->environment());
    }

    public function test_database_uses_mysql_test_database(): void
    {
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertSame('opdadmin_test', DB::connection()->getDatabaseName());
    }
}