<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ResourceController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::get('/csrf-token', fn () => response()->json(['csrf_token' => csrf_token()]));
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::middleware('auth')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'updatePassword']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth')->group(function () {
    Route::prefix('analytics')->controller(AnalyticsController::class)->group(function () {
        Route::get('/summary', 'summary');
        Route::get('/sales-trend', 'salesTrend');
        Route::get('/top-products', 'topProducts');
        Route::get('/revenue-by-category', 'revenueByCategory');
        Route::get('/top-customers', 'topCustomers');
        Route::get('/orders-by-status', 'ordersByStatus');
        Route::get('/low-stock', 'lowStock');
        Route::get('/payments-by-status', 'paymentsByStatus');
    });

    Route::get('/{resource}', [ResourceController::class, 'index']);
    Route::post('/{resource}', [ResourceController::class, 'store']);
    Route::get('/{resource}/{id}', [ResourceController::class, 'show'])->whereNumber('id');
    Route::put('/{resource}/{id}', [ResourceController::class, 'update'])->whereNumber('id');
    Route::patch('/{resource}/{id}', [ResourceController::class, 'update'])->whereNumber('id');
    Route::delete('/{resource}/{id}', [ResourceController::class, 'destroy'])->whereNumber('id');
});
