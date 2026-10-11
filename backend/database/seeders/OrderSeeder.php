<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
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
        $customerIds = DB::table('customers')
            ->where('user_id', $userId)
            ->whereIn('email', $customerEmails)
            ->pluck('id', 'email');

        $statuses = [
            'completed',
            'completed',
            'pending',
            'processing',
            'cancelled',
            'completed',
            'shipped',
            'completed',
            'pending',
            'processing',
        ];

        for ($i = 1; $i <= 30; $i++) {
            $customerEmail = $customerEmails[($i - 1) % count($customerEmails)];
            $customerId = $customerIds[$customerEmail]
                ?? throw new \RuntimeException("Seed customer not found: {$customerEmail}");
            $orderedAt = $baseDate->copy()->addDays(($i - 1) * 10);

            DB::table('orders')->updateOrInsert(
                ['user_id' => $userId, 'customer_id' => $customerId, 'ordered_at' => $orderedAt],
                [
                'user_id' => $userId,
                'status' => $statuses[($i - 1) % count($statuses)],
                'created_at' => $now,
                'updated_at' => $now,
                ],
            );
        }
    }
}
