<?php

namespace App\Http\Controllers;

use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function summary()
    {
        $userId = $this->ownerId();
        $paidPayments = DB::table('payments as pay')
            ->join('orders as o', 'o.id', '=', 'pay.order_id')
            ->where('pay.user_id', $userId)
            ->where('o.user_id', $userId)
            ->where('pay.status', 'paid')
            ->where('o.status', '!=', 'cancelled')
            ->whereNotExists($this->refundedOrderExists('o.id'));
        $revenue = (float) (clone $paidPayments)->sum('pay.amount');
        $paidOrderCount = (int) (clone $paidPayments)->distinct()->count('o.id');

        return response()->json(['data' => [
            'total_revenue' => round($revenue, 2),
            'total_orders' => (int) DB::table('orders')->where('user_id', $userId)->count(),
            'paid_orders' => $paidOrderCount,
            'average_paid_order_value' => $paidOrderCount > 0 ? round($revenue / $paidOrderCount, 2) : 0,
            'pending_orders' => (int) DB::table('orders')->where('user_id', $userId)->where('status', 'pending')->count(),
            'cancelled_orders' => (int) DB::table('orders')->where('user_id', $userId)->where('status', 'cancelled')->count(),
            'low_stock_products' => (int) DB::table('products')->where('user_id', $userId)->where('stock_quantity', '<=', 5)->count(),
        ]]);
    }

    public function salesTrend(Request $request)
    {
        $validated = $request->validate(['months' => ['sometimes', 'integer', 'min:1', 'max:24']]);
        $months = (int) ($validated['months'] ?? 12);
        $userId = $this->ownerId();
        $firstMonth = Carbon::now()->startOfMonth()->subMonths($months - 1);
        $lastMonth = Carbon::now()->endOfMonth();

        $totals = DB::table('payments as pay')
            ->join('orders as o', 'o.id', '=', 'pay.order_id')
            ->where('pay.user_id', $userId)
            ->where('o.user_id', $userId)
            ->where('pay.status', 'paid')
            ->where('o.status', '!=', 'cancelled')
            ->whereNotExists($this->refundedOrderExists('o.id'))
            ->whereNotNull('pay.paid_at')
            ->whereBetween('pay.paid_at', [$firstMonth, $lastMonth])
            ->selectRaw("DATE_FORMAT(pay.paid_at, '%Y-%m') as month, SUM(pay.amount) as revenue")
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('revenue', 'month');

        $data = collect(range(0, $months - 1))->map(function (int $offset) use ($firstMonth, $totals) {
            $month = $firstMonth->copy()->addMonths($offset)->format('Y-m');

            return ['month' => $month, 'revenue' => round((float) ($totals[$month] ?? 0), 2)];
        });

        return response()->json(['data' => $data]);
    }

    public function topProducts(Request $request)
    {
        $validated = $request->validate(['limit' => ['sometimes', 'integer', 'min:1', 'max:50']]);
        $limit = (int) ($validated['limit'] ?? 10);
        $userId = $this->ownerId();

        $products = DB::table('order_items as oi')
            ->join('products as p', 'p.id', '=', 'oi.product_id')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->where('oi.user_id', $userId)
            ->where('p.user_id', $userId)
            ->where('o.user_id', $userId)
            ->where('o.status', '!=', 'cancelled')
            ->whereExists($this->paidOrderExists('o.id'))
            ->whereNotExists($this->refundedOrderExists('o.id'))
            ->select('p.id', 'p.name', 'p.sku')
            ->selectRaw('SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.unit_price) as revenue')
            ->groupBy('p.id', 'p.name', 'p.sku')
            ->orderByDesc('units_sold')
            ->limit($limit)
            ->get()
            ->map(fn (object $product) => [
                'id' => (int) $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'units_sold' => (int) $product->units_sold,
                'revenue' => round((float) $product->revenue, 2),
            ]);

        return response()->json(['data' => $products]);
    }

    public function revenueByCategory()
    {
        $userId = $this->ownerId();
        $categories = DB::table('order_items as oi')
            ->join('products as p', 'p.id', '=', 'oi.product_id')
            ->join('categories as c', 'c.id', '=', 'p.category_id')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->where('oi.user_id', $userId)
            ->where('p.user_id', $userId)
            ->where('c.user_id', $userId)
            ->where('o.user_id', $userId)
            ->where('o.status', '!=', 'cancelled')
            ->whereExists($this->paidOrderExists('o.id'))
            ->whereNotExists($this->refundedOrderExists('o.id'))
            ->select('c.id', 'c.name')
            ->selectRaw('SUM(oi.quantity * oi.unit_price) as revenue')
            ->groupBy('c.id', 'c.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn (object $category) => [
                'id' => (int) $category->id,
                'name' => $category->name,
                'revenue' => round((float) $category->revenue, 2),
            ]);

        return response()->json(['data' => $categories]);
    }

    public function topCustomers(Request $request)
    {
        $validated = $request->validate(['limit' => ['sometimes', 'integer', 'min:1', 'max:50']]);
        $limit = (int) ($validated['limit'] ?? 10);
        $userId = $this->ownerId();

        $customers = DB::table('customers as c')
            ->join('orders as o', 'o.customer_id', '=', 'c.id')
            ->join('payments as pay', 'pay.order_id', '=', 'o.id')
            ->where('c.user_id', $userId)
            ->where('o.user_id', $userId)
            ->where('pay.user_id', $userId)
            ->where('pay.status', 'paid')
            ->where('o.status', '!=', 'cancelled')
            ->whereNotExists($this->refundedOrderExists('o.id'))
            ->select('c.id', 'c.name', 'c.email')
            ->selectRaw('SUM(pay.amount) as total_spent, COUNT(DISTINCT o.id) as paid_orders')
            ->groupBy('c.id', 'c.name', 'c.email')
            ->orderByDesc('total_spent')
            ->limit($limit)
            ->get()
            ->map(fn (object $customer) => [
                'id' => (int) $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'total_spent' => round((float) $customer->total_spent, 2),
                'paid_orders' => (int) $customer->paid_orders,
            ]);

        return response()->json(['data' => $customers]);
    }

    public function ordersByStatus()
    {
        $data = DB::table('orders')
            ->where('user_id', $this->ownerId())
            ->select('status')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(fn (object $item) => ['status' => $item->status, 'total' => (int) $item->total]);

        return response()->json(['data' => $data]);
    }

    public function lowStock(Request $request)
    {
        $validated = $request->validate(['threshold' => ['sometimes', 'integer', 'min:0', 'max:100000']]);
        $threshold = (int) ($validated['threshold'] ?? 5);

        $products = DB::table('products')
            ->where('user_id', $this->ownerId())
            ->where('stock_quantity', '<=', $threshold)
            ->orderBy('stock_quantity')
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'stock_quantity'])
            ->map(fn (object $product) => [
                'id' => (int) $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'stock_quantity' => (int) $product->stock_quantity,
            ]);

        return response()->json(['data' => $products, 'meta' => ['threshold' => $threshold]]);
    }

    public function paymentsByStatus()
    {
        $data = DB::table('payments')
            ->where('user_id', $this->ownerId())
            ->select('status')
            ->selectRaw('COUNT(*) as total, SUM(amount) as amount')
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(fn (object $item) => [
                'status' => $item->status,
                'total' => (int) $item->total,
                'amount' => round((float) $item->amount, 2),
            ]);

        return response()->json(['data' => $data]);
    }

    private function paidOrderExists(string $orderColumn): Builder
    {
        return DB::table('payments')
            ->selectRaw('1')
            ->where('user_id', $this->ownerId())
            ->whereColumn('payments.order_id', $orderColumn)
            ->where('payments.status', 'paid');
    }

    private function refundedOrderExists(string $orderColumn): Builder
    {
        return DB::table('payments')
            ->selectRaw('1')
            ->where('user_id', $this->ownerId())
            ->whereColumn('payments.order_id', $orderColumn)
            ->where('payments.status', 'refunded');
    }

    private function ownerId(): int
    {
        return (int) Auth::id();
    }
}
