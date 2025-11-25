<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name', 'EspacioX API'),
        'status' => 'ok',
        'env' => config('app.env'),
    ]);
});

Route::get('/healthz', function () {
    return response()->json([
        'app_key_set' => (bool) config('app.key'),
        'app_env' => config('app.env'),
        'app_debug' => config('app.debug'),
        'has_dotenv' => file_exists(base_path('.env')),
    ]);
});
