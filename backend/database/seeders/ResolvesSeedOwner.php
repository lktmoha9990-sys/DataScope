<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;
use RuntimeException;

trait ResolvesSeedOwner
{
    protected function seedOwnerId(): int
    {
        $configuredId = env('DATASCOPE_SEED_USER_ID');
        if ($configuredId !== null && $configuredId !== '') {
            $userId = (int) $configuredId;
            if (DB::table('users')->where('id', $userId)->exists()) {
                return $userId;
            }

            throw new RuntimeException("Seed owner user {$userId} does not exist.");
        }

        if (DB::table('users')->count() !== 1) {
            throw new RuntimeException('Create exactly one account first or set DATASCOPE_SEED_USER_ID to the account that should own the sample data.');
        }

        return (int) DB::table('users')->value('id');
    }
}
