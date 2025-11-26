<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Public\SpaceController;
use App\Http\Controllers\Api\Client\BookingController as ClientBookingController;
use App\Http\Controllers\Api\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Api\Admin\BookingBlockController;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

Route::get('spaces', [SpaceController::class, 'index']);
Route::get('spaces/{space}/calendar', [SpaceController::class, 'calendar']);
Route::get('spaces/{space}/availability', [SpaceController::class, 'availability']);

// Permitir reservas aunque no haya autenticación (para demo pública).
Route::post('bookings', [ClientBookingController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    Route::get('bookings/my', [ClientBookingController::class, 'index']);
    Route::get('bookings/{booking}', [ClientBookingController::class, 'show']);
    Route::patch('bookings/{booking}/cancel', [ClientBookingController::class, 'cancel']);

    Route::middleware('is_admin')->prefix('admin')->group(function () {
        Route::get('bookings', [AdminBookingController::class, 'index']);
        Route::patch('bookings/{booking}/confirm', [AdminBookingController::class, 'confirm']);
        Route::patch('bookings/{booking}/cancel', [AdminBookingController::class, 'cancel']);
        Route::post('blocks', [BookingBlockController::class, 'store']);
    });
});
