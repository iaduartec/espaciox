<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Http\JsonResponse;

class HealthCheckController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [
            'db' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
        ];

        $ok = collect($checks)->every(fn ($c) => $c['status'] === 'ok');

        return response()
            ->json([
                'status' => $ok ? 'ok' : 'degraded',
                'checks' => $checks,
                'timestamp' => now()->toIso8601String(),
            ], $ok ? 200 : 503)
            ->header('Cache-Control', 'no-store, no-cache, max-age=0');
    }

    private function checkDatabase(): array
    {
        try {
            DB::select('select 1');
            return ['status' => 'ok'];
        } catch (\Throwable $e) {
            return ['status' => 'fail', 'message' => 'db unavailable'];
        }
    }

    private function checkCache(): array
    {
        try {
            $key = 'healthcheck:'.uniqid();
            Cache::put($key, '1', 5);
            $value = Cache::get($key);
            return ['status' => $value === '1' ? 'ok' : 'fail'];
        } catch (\Throwable $e) {
            return ['status' => 'fail', 'message' => 'cache unavailable'];
        }
    }

    private function checkQueue(): array
    {
        try {
            $connection = Queue::getName() ?: config('queue.default');
            Queue::connection()->size(); // may be 0 for sync, but ensures driver is reachable
            return ['status' => 'ok', 'connection' => $connection];
        } catch (\Throwable $e) {
            return ['status' => 'fail', 'message' => 'queue unavailable'];
        }
    }
}
