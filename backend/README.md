# DataScope API

Laravel 12 backend for the DataScope e-commerce analytics dashboard. It provides session authentication, account-scoped CRUD for store data, and SQL-backed analytics endpoints.

See the [project README](../README.md) for setup instructions, data relationships, API routes, sample data, and verification steps.

## Local setup

Configure `.env`, install dependencies, and run the forward migrations:

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Run backend feature checks with `php artisan test`. PHPUnit uses a temporary in-memory SQLite database, so these checks do not touch the local MySQL database.