<?php

use Illuminate\Support\Facades\Route;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

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
    error_log('[healthz] app_key=' . (config('app.key') ? 'set' : 'missing') . ' dotenv=' . (file_exists(base_path('.env')) ? 'yes' : 'no'));
    return response()->json([
        'app_key_set' => (bool) config('app.key'),
        'app_env' => config('app.env'),
        'app_debug' => config('app.debug'),
        'has_dotenv' => file_exists(base_path('.env')),
    ]);
});

Route::get('/logs', function () {
    $path = storage_path('logs/laravel.log');
    if (! File::exists($path)) {
        return response('laravel.log not found', 404);
    }

    $lines = explode("\n", File::get($path));
    $tail = array_slice($lines, -200);

    return response(implode("\n", $tail), 200, ['Content-Type' => 'text/plain']);
});
