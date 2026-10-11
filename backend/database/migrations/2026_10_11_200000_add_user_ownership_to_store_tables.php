<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = ['customers', 'categories', 'products', 'orders', 'order_items', 'payments'];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            });
        }

        // Preserve legacy data when it can be assigned unambiguously.
        if (DB::table('users')->count() === 1) {
            $userId = DB::table('users')->value('id');
            foreach ($this->tables as $tableName) {
                DB::table($tableName)->whereNull('user_id')->update(['user_id' => $userId]);
            }
        }

        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique('customers_email_unique');
            $table->unique(['user_id', 'email']);
        });
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_name_unique');
            $table->unique(['user_id', 'name']);
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_sku_unique');
            $table->unique(['user_id', 'sku']);
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique('customers_user_id_email_unique');
            $table->unique('email');
        });
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_user_id_name_unique');
            $table->unique('name');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_user_id_sku_unique');
            $table->unique('sku');
        });

        foreach (array_reverse($this->tables) as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('user_id');
            });
        }
    }
};
