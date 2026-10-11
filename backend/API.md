# DataScope API

Run the Laravel backend and use `http://127.0.0.1:8000/api` as the API base URL.
All endpoints in this document are read-only and return JSON.
Send `Accept: application/json` from the frontend. The development CORS config
allows `http://localhost:5173` and `http://127.0.0.1:5173`; set `FRONTEND_URL`
in `.env` if Vite uses a different origin.

## Dashboard analytics

| Endpoint | Purpose | Optional query |
| --- | --- | --- |
| `GET /analytics/summary` | Revenue and headline order/stock counts | — |
| `GET /analytics/sales-trend` | Monthly paid revenue, including zero-value months | `months` (1–24, default 12) |
| `GET /analytics/top-products` | Best-selling products by units sold | `limit` (1–50, default 10) |
| `GET /analytics/revenue-by-category` | Paid order-item revenue grouped by category | — |
| `GET /analytics/top-customers` | Customers ranked by paid spend | `limit` (1–50, default 10) |
| `GET /analytics/orders-by-status` | Order counts grouped by status | — |
| `GET /analytics/low-stock` | Products at or below the stock threshold | `threshold` (0–100000, default 5) |
| `GET /analytics/payments-by-status` | Payment counts and amounts by status | — |

The summary response is shaped like this:

```json
{
  "data": {
    "total_revenue": 23579.4,
    "total_orders": 30,
    "paid_orders": 15,
    "average_paid_order_value": 1571.96,
    "pending_orders": 6,
    "cancelled_orders": 3,
    "low_stock_products": 2
  }
}
```

Revenue metrics count paid payments only, and exclude cancelled orders and any
order that has a refunded payment. `average_paid_order_value` divides that
revenue by the number of distinct paid orders.

## Data endpoints

| Collection | Detail | Supported filters |
| --- | --- | --- |
| `GET /customers` | `GET /customers/{id}` | `search` by name |
| `GET /categories` | `GET /categories/{id}` | `search` by name |
| `GET /products` | `GET /products/{id}` | `search`, `category_id` |
| `GET /orders` | `GET /orders/{id}` | `customer_id`, `status` |
| `GET /order-items` | `GET /order-items/{id}` | `order_id`, `product_id` |
| `GET /payments` | `GET /payments/{id}` | `order_id`, `status` |

Collection endpoints accept `per_page` from 1 to 100 (default 15) and return
Laravel's paginator object, including `data`, `current_page`, `last_page`, and
`total`. Related category, customer, product, item, and payment records are
included where useful. A detail endpoint wraps its record in `{ "data": ... }`.

Invalid query values return HTTP 422 with Laravel's standard validation error
JSON. Unknown resources and missing record IDs return HTTP 404.

## Example requests

```text
GET /api/analytics/summary
GET /api/analytics/sales-trend?months=12
GET /api/analytics/top-products?limit=5
GET /api/products?category_id=2&per_page=20
GET /api/orders?status=completed&per_page=10
```
