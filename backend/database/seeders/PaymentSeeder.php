<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentSeeder extends Seeder
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

        for ($orderId = 1; $orderId <= 30; $orderId++) {
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

            $total = DB::table('order_items')
                ->where('user_id', $userId)
                ->where('order_id', $order->id)
                ->selectRaw('SUM(quantity * unit_price) as total')
                ->value('total');

            if ($total === null) {
                throw new \RuntimeException("Seed order {$orderId} has no items");
            }

            $status = match ($order->status) {
                'completed', 'shipped' => 'paid',
                'cancelled' => 'refunded',
                default => 'pending',
            };

            DB::table('payments')->updateOrInsert(
                ['user_id' => $userId, 'order_id' => $order->id],
                [
                    'user_id' => $userId,
                    'amount' => $total,
                    'status' => $status,
                    'paid_at' => $status === 'paid' ? $order->ordered_at : null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }
}
