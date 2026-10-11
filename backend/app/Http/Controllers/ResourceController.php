<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ResourceController extends Controller
{
    private const RESOURCES = [
        'customers' => Customer::class,
        'categories' => Category::class,
        'products' => Product::class,
        'orders' => Order::class,
        'order-items' => OrderItem::class,
        'payments' => Payment::class,
    ];

    private const RELATIONS = [
        'products' => ['category'],
        'orders' => ['customer', 'items.product', 'payments'],
        'order-items' => ['order.customer', 'product.category'],
        'payments' => ['order.customer'],
    ];

    private const FILTERS = [
        'products' => ['category_id'],
        'orders' => ['customer_id', 'status'],
        'order-items' => ['order_id', 'product_id'],
        'payments' => ['order_id', 'status'],
    ];

    private const SEARCHABLE = [
        'customers' => ['name', 'email'],
        'categories' => ['name'],
        'products' => ['name', 'sku'],
    ];

    public function index(Request $request, string $resource)
    {
        $model = $this->model($resource);
        $filters = self::FILTERS[$resource] ?? [];
        $rules = [
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'search' => ['sometimes', 'string', 'max:150'],
        ];

        foreach ($filters as $filter) {
            $rules[$filter] = $filter === 'status'
                ? ['sometimes', Rule::in($resource === 'orders'
                    ? ['pending', 'processing', 'shipped', 'completed', 'cancelled']
                    : ['pending', 'paid', 'failed', 'refunded'])]
                : ['sometimes', 'integer', 'min:1'];
        }

        $validated = $request->validate($rules);
        $query = $model::query()->where('user_id', $request->user()->id)->with(self::RELATIONS[$resource] ?? []);

        foreach ($filters as $filter) {
            if (isset($validated[$filter])) {
                $query->where($filter, $validated[$filter]);
            }
        }

        if (isset($validated['search']) && isset(self::SEARCHABLE[$resource])) {
            $search = $validated['search'];
            $query->where(function ($builder) use ($resource, $search) {
                foreach (self::SEARCHABLE[$resource] as $column) {
                    $builder->orWhere($column, 'like', '%'.$search.'%');
                }
            });
        }

        return response()->json($query->latest('id')->paginate((int) ($validated['per_page'] ?? 15)));
    }

    public function show(Request $request, string $resource, int $id)
    {
        $record = $this->model($resource)::query()->where('user_id', $request->user()->id)
            ->with(self::RELATIONS[$resource] ?? [])->findOrFail($id);

        return response()->json(['data' => $record]);
    }

    public function store(Request $request, string $resource)
    {
        $model = $this->model($resource);
        $data = $request->validate($this->rules($resource, $request->user()->id));
        $record = new $model($data);
        $record->user_id = $request->user()->id;
        $record->save();
        $record->load(self::RELATIONS[$resource] ?? []);

        return response()->json(['data' => $record], 201);
    }

    public function update(Request $request, string $resource, int $id)
    {
        $model = $this->model($resource);
        $record = $model::query()->where('user_id', $request->user()->id)->findOrFail($id);
        $data = $request->validate($this->rules($resource, $request->user()->id, $record->getKey()));
        $record->update($data);
        $record->load(self::RELATIONS[$resource] ?? []);

        return response()->json(['data' => $record]);
    }

    public function destroy(Request $request, string $resource, int $id)
    {
        $record = $this->model($resource)::query()->where('user_id', $request->user()->id)->findOrFail($id);

        try {
            DB::transaction(fn () => $record->delete());
        } catch (QueryException $exception) {
            if (in_array((string) $exception->getCode(), ['23000', '23503'], true)) {
                return response()->json([
                    'message' => 'This record is linked to other records and cannot be deleted.',
                ], 409);
            }

            throw $exception;
        }

        return response()->json(['message' => 'Record deleted successfully.']);
    }

    private function rules(string $resource, int $userId, ?int $id = null): array
    {
        $required = $id === null ? 'required' : 'sometimes';

        return match ($resource) {
            'customers' => [
                'name' => [$required, 'string', 'max:150'],
                'email' => [$required, 'email', 'max:255', Rule::unique('customers', 'email')->where(fn ($query) => $query->where('user_id', $userId))->ignore($id)],
                'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            ],
            'categories' => [
                'name' => [$required, 'string', 'max:100', Rule::unique('categories', 'name')->where(fn ($query) => $query->where('user_id', $userId))->ignore($id)],
                'description' => ['sometimes', 'nullable', 'string'],
            ],
            'products' => [
                'category_id' => [$required, 'integer', Rule::exists('categories', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
                'name' => [$required, 'string', 'max:150'],
                'sku' => [$required, 'string', 'max:100', Rule::unique('products', 'sku')->where(fn ($query) => $query->where('user_id', $userId))->ignore($id)],
                'price' => [$required, 'numeric', 'min:0', 'max:99999999.99'],
                'stock_quantity' => ['sometimes', 'integer', 'min:0'],
            ],
            'orders' => [
                'customer_id' => [$required, 'integer', Rule::exists('customers', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
                'status' => ['sometimes', Rule::in(['pending', 'processing', 'shipped', 'completed', 'cancelled'])],
                'ordered_at' => ['sometimes', 'date'],
            ],
            'order-items' => [
                'order_id' => [$required, 'integer', Rule::exists('orders', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
                'product_id' => [$required, 'integer', Rule::exists('products', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
                'quantity' => [$required, 'integer', 'min:1'],
                'unit_price' => [$required, 'numeric', 'min:0', 'max:99999999.99'],
            ],
            'payments' => [
                'order_id' => [$required, 'integer', Rule::exists('orders', 'id')->where(fn ($query) => $query->where('user_id', $userId))],
                'amount' => [$required, 'numeric', 'gt:0', 'max:99999999.99'],
                'status' => ['sometimes', Rule::in(['pending', 'paid', 'failed', 'refunded'])],
                'paid_at' => ['sometimes', 'nullable', 'date'],
            ],
            default => abort(404, 'Resource not found.'),
        };
    }

    private function model(string $resource): string
    {
        abort_unless(isset(self::RESOURCES[$resource]), 404, 'Resource not found.');

        return self::RESOURCES[$resource];
    }
}
