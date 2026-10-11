<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderItemSeeder extends Seeder
{
    use ResolvesSeedOwner;

    public function run(): void
    {
        $userId = $this->seedOwnerId();
        $now = now();
        $baseDate = now()->setDate(2025, 10, 1)->startOfDay();
        $customerEmails = [
            'ahmad@example.com', 'sara@example.com', 'omar@example.com',
            'lina@example.com', 'yousef@example.com', 'maya@example.com',
            'khaled@example.com', 'noor@example.com', 'tareq@example.com',
            'rana@example.com',
        ];
        $customerIds = DB::table('customers')->where('user_id', $userId)->whereIn('email', $customerEmails)->pluck('id', 'email');
        $productSkus = [
            'ELEC-001', 'ELEC-002', 'ELEC-003', 'ELEC-004',
            'COMP-001', 'COMP-002', 'COMP-003', 'COMP-004',
            'ACC-001', 'ACC-002', 'ACC-003', 'ACC-004',
            'HOME-001', 'HOME-002', 'HOME-003', 'HOME-004',
            'GAME-001', 'GAME-002', 'GAME-003', 'GAME-004',
        ];

        for ($orderId = 1; $orderId <= 30; $orderId++) {
            // Each order contains between 1 and 3 products.
            $numberOfItems = (($orderId - 1) % 3) + 1;

            $customerEmail = $customerEmails[($orderId - 1) % count($customerEmails)];
            $customerId = $customerIds[$customerEmail]
                ?? throw new \RuntimeException("Seed customer not found: {$customerEmail}");
            $orderedAt = $baseDate->copy()->addDays(($orderId - 1) * 10);
            $order = DB::table('orders')
                ->where('user_id', $userId)
                ->where('customer_id', $customerId)
                ->where('ordered_at', $orderedAt)
                ->first();

            if ($order === null) {
                throw new \RuntimeException("Seed order not found for sample order {$orderId}");
            }

            for ($j = 0; $j < $numberOfItems; $j++) {
                $productIndex = ($orderId + $j * 7 - 1) % count($productSkus);
                $product = DB::table('products')->where('user_id', $userId)->where('sku', $productSkus[$productIndex])->first();

                if ($product === null) {
                    throw new \RuntimeException("Seed product not found: {$productSkus[$productIndex]}");
                }

                $quantity = (($orderId + $j) % 3) + 1;

                DB::table('order_items')->updateOrInsert(
                    ['user_id' => $userId, 'order_id' => $order->id, 'product_id' => $product->id],
                    [
                        'user_id' => $userId,
                        'quantity' => $quantity,
                        'unit_price' => $product->price,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                );
            }
        }
    }
}
