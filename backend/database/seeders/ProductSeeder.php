<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    use ResolvesSeedOwner;

    public function run(): void
    {
        $userId = $this->seedOwnerId();
        $now = now();

        $categoryIds = DB::table('categories')->where('user_id', $userId)->pluck('id', 'name');
        $products = [
            [
                'category_id' => 1,
                'name' => 'Samsung Galaxy A55',
                'sku' => 'ELEC-001',
                'price' => 349.99,
                'stock_quantity' => 15,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 1,
                'name' => 'Apple iPhone 15',
                'sku' => 'ELEC-002',
                'price' => 799.99,
                'stock_quantity' => 8,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 1,
                'name' => 'Samsung 4K TV',
                'sku' => 'ELEC-003',
                'price' => 549.99,
                'stock_quantity' => 6,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 1,
                'name' => 'JBL Bluetooth Speaker',
                'sku' => 'ELEC-004',
                'price' => 79.99,
                'stock_quantity' => 25,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 2,
                'name' => 'Dell Inspiron Laptop',
                'sku' => 'COMP-001',
                'price' => 699.99,
                'stock_quantity' => 10,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 2,
                'name' => 'HP Pavilion Laptop',
                'sku' => 'COMP-002',
                'price' => 649.99,
                'stock_quantity' => 7,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 2,
                'name' => 'Kingston 1TB SSD',
                'sku' => 'COMP-003',
                'price' => 89.99,
                'stock_quantity' => 30,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 2,
                'name' => 'Gaming Desktop PC',
                'sku' => 'COMP-004',
                'price' => 1199.99,
                'stock_quantity' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 3,
                'name' => 'Logitech Wireless Mouse',
                'sku' => 'ACC-001',
                'price' => 24.99,
                'stock_quantity' => 40,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 3,
                'name' => 'Mechanical Keyboard',
                'sku' => 'ACC-002',
                'price' => 69.99,
                'stock_quantity' => 18,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 3,
                'name' => 'USB-C Hub',
                'sku' => 'ACC-003',
                'price' => 34.99,
                'stock_quantity' => 22,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 3,
                'name' => 'Laptop Backpack',
                'sku' => 'ACC-004',
                'price' => 39.99,
                'stock_quantity' => 16,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 4,
                'name' => 'Philips Air Fryer',
                'sku' => 'HOME-001',
                'price' => 129.99,
                'stock_quantity' => 12,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 4,
                'name' => 'Electric Kettle',
                'sku' => 'HOME-002',
                'price' => 29.99,
                'stock_quantity' => 20,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 4,
                'name' => 'Microwave Oven',
                'sku' => 'HOME-003',
                'price' => 149.99,
                'stock_quantity' => 9,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 4,
                'name' => 'Robot Vacuum Cleaner',
                'sku' => 'HOME-004',
                'price' => 249.99,
                'stock_quantity' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 5,
                'name' => 'Xbox Wireless Controller',
                'sku' => 'GAME-001',
                'price' => 59.99,
                'stock_quantity' => 14,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 5,
                'name' => 'Gaming Headset',
                'sku' => 'GAME-002',
                'price' => 89.99,
                'stock_quantity' => 11,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 5,
                'name' => 'Gaming Mouse Pad',
                'sku' => 'GAME-003',
                'price' => 19.99,
                'stock_quantity' => 35,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'category_id' => 5,
                'name' => 'Gaming Chair',
                'sku' => 'GAME-004',
                'price' => 179.99,
                'stock_quantity' => 6,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($products as $product) {
            $categoryName = match (true) {
                str_starts_with($product['sku'], 'ELEC-') => 'Electronics',
                str_starts_with($product['sku'], 'COMP-') => 'Computers',
                str_starts_with($product['sku'], 'ACC-') => 'Accessories',
                str_starts_with($product['sku'], 'HOME-') => 'Home Appliances',
                str_starts_with($product['sku'], 'GAME-') => 'Gaming',
            };
            $product['category_id'] = $categoryIds[$categoryName]
                ?? throw new \RuntimeException("Seed category not found: {$categoryName}");
            $product['user_id'] = $userId;

            DB::table('products')->updateOrInsert(
                ['user_id' => $userId, 'sku' => $product['sku']],
                $product,
            );
        }
    }
}
