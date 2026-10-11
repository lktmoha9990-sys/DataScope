<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    use ResolvesSeedOwner;

    public function run(): void
    {
        $userId = $this->seedOwnerId();
        $categories = [
            [
                'name' => 'Electronics',
                'description' => 'Electronic devices and accessories',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Computers',
                'description' => 'Laptops and computer equipment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Accessories',
                'description' => 'Technology accessories and peripherals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Home Appliances',
                'description' => 'Appliances for everyday home use',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Gaming',
                'description' => 'Gaming devices and equipment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($categories as $category) {
            DB::table('categories')->updateOrInsert(
                ['user_id' => $userId, 'name' => $category['name']],
                [
                    'user_id' => $userId,
                    'description' => $category['description'],
                    'created_at' => $category['created_at'],
                    'updated_at' => $category['updated_at'],
                ],
            );
        }
    }
}
