<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name', 'EspacioX API'),
        'status' => 'ok',
        'env' => config('app.env'),
    ]);
});
