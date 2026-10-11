<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomerSeeder extends Seeder
{
    use ResolvesSeedOwner;

    public function run(): void
    {
        $userId = $this->seedOwnerId();
        $now = now();

        $customers = [
            ['Ahmad Khalil', 'ahmad@example.com', '0599000001'],
            ['Sara Nasser', 'sara@example.com', '0599000002'],
            ['Omar Saleh', 'omar@example.com', '0599000003'],
            ['Lina Ibrahim', 'lina@example.com', '0599000004'],
            ['Yousef Hamdan', 'yousef@example.com', '0599000005'],
            ['Maya Adel', 'maya@example.com', '0599000006'],
            ['Khaled Samir', 'khaled@example.com', '0599000007'],
            ['Noor Fadi', 'noor@example.com', '0599000008'],
            ['Tareq Amin', 'tareq@example.com', '0599000009'],
            ['Rana Mahmoud', 'rana@example.com', '0599000010'],
        ];

        foreach ($customers as [$name, $email, $phone]) {
            DB::table('customers')->updateOrInsert(
                ['user_id' => $userId, 'email' => $email],
                [
                    'user_id' => $userId,
                    'name' => $name,
                    'phone' => $phone,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }
}
