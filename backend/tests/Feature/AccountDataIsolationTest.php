<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountDataIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_lists_and_item_routes_are_scoped_to_the_signed_in_account(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $ownedProduct = $this->createProduct($owner, 'Owned laptop', 'OWN-001');
        $otherProduct = $this->createProduct($other, 'Private laptop', 'OTHER-001');

        $this->actingAs($owner)->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Owned laptop');

        $this->actingAs($owner)->getJson('/api/products/'.$otherProduct->id)->assertNotFound();
        $this->actingAs($owner)->putJson('/api/products/'.$otherProduct->id, ['name' => 'Changed'])->assertNotFound();
        $this->actingAs($owner)->deleteJson('/api/products/'.$otherProduct->id)->assertNotFound();

        $this->assertDatabaseHas('products', ['id' => $ownedProduct->id, 'user_id' => $owner->id]);
        $this->assertDatabaseHas('products', ['id' => $otherProduct->id, 'user_id' => $other->id]);
    }

    public function test_product_creation_uses_the_account_and_rejects_another_accounts_category(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $category = Category::forceCreate(['user_id' => $owner->id, 'name' => 'Owner category']);
        $otherCategory = Category::forceCreate(['user_id' => $other->id, 'name' => 'Other category']);

        $this->actingAs($owner)->postJson('/api/products', [
            'category_id' => $category->id,
            'name' => 'New owner product',
            'sku' => 'OWNER-NEW',
            'price' => 15.5,
            'stock_quantity' => 4,
        ])->assertCreated()->assertJsonPath('data.name', 'New owner product');

        $this->assertDatabaseHas('products', [
            'sku' => 'OWNER-NEW',
            'user_id' => $owner->id,
            'category_id' => $category->id,
        ]);

        $this->actingAs($owner)->postJson('/api/products', [
            'category_id' => $otherCategory->id,
            'name' => 'Invalid cross-account product',
            'sku' => 'OWNER-BAD',
            'price' => 5,
        ])->assertUnprocessable()->assertJsonValidationErrors('category_id');
    }

    public function test_dashboard_metrics_only_include_the_signed_in_accounts_records(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $ownerCustomer = Customer::forceCreate(['user_id' => $owner->id, 'name' => 'Owner Customer', 'email' => 'owner@example.test']);
        $otherCustomer = Customer::forceCreate(['user_id' => $other->id, 'name' => 'Other Customer', 'email' => 'other@example.test']);
        $ownerOrder = Order::forceCreate(['user_id' => $owner->id, 'customer_id' => $ownerCustomer->id, 'status' => 'completed', 'ordered_at' => now()]);
        $otherOrder = Order::forceCreate(['user_id' => $other->id, 'customer_id' => $otherCustomer->id, 'status' => 'pending', 'ordered_at' => now()]);
        Payment::forceCreate(['user_id' => $owner->id, 'order_id' => $ownerOrder->id, 'amount' => 125.50, 'status' => 'paid', 'paid_at' => now()]);
        Payment::forceCreate(['user_id' => $other->id, 'order_id' => $otherOrder->id, 'amount' => 900, 'status' => 'pending']);

        $this->actingAs($owner)->getJson('/api/analytics/summary')
            ->assertOk()
            ->assertJsonPath('data.total_revenue', 125.5)
            ->assertJsonPath('data.total_orders', 1)
            ->assertJsonPath('data.pending_orders', 0);
    }

    public function test_analytics_api_requires_authentication(): void
    {
        $this->getJson('/api/analytics/summary')->assertUnauthorized();
    }

    private function createProduct(User $user, string $name, string $sku): Product
    {
        $category = Category::forceCreate(['user_id' => $user->id, 'name' => $name.' category']);

        return Product::forceCreate([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'name' => $name,
            'sku' => $sku,
            'price' => 100,
            'stock_quantity' => 8,
        ]);
    }
}
