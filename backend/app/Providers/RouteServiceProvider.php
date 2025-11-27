<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(
                optional($request->user())->id ?: $request->ip()
            );
        });

        RateLimiter::for('auth', function (Request $request) {
            $identifier = $request->input('email') ?: $request->ip();

            return Limit::perMinute(10)->by($identifier);
        });

        RateLimiter::for('booking-submission', function (Request $request) {
            $identifier = $request->input('customer_email') ?: $request->input('email') ?: $request->ip();

            return Limit::perMinute(20)->by($identifier);
        });
    }
}
