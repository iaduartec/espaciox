<?php

use Illuminate\Support\Facades\Route;

use Illuminate\Support\Facades\Log;

Route::get('/', function () {
    try {
        $payload = [
            'name' => config('app.name', 'EspacioX API'),
            'status' => 'ok',
            'env' => config('app.env'),
            'app_key_set' => (bool) config('app.key'),
        ];
        Log::info('Root health check', $payload);
        return response()->json($payload);
    } catch (\Throwable $e) {
        Log::error('Root health failed', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        return response()->json([
            'error' => $e->getMessage(),
            'exception' => get_class($e),
        ], 500);
    }
});

Route::get('/healthz', function () {
    return response()->json([
        'app_key_set' => (bool) config('app.key'),
        'app_env' => config('app.env'),
        'app_debug' => config('app.debug'),
        'has_dotenv' => file_exists(base_path('.env')),
    ]);
});
