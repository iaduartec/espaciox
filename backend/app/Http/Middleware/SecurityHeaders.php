<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Remove headers that should not be exposed
        header_remove('X-Powered-By');
        header_remove('Expires');
        header_remove('X-Frame-Options');

        // Add required security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff', false);
        $response->headers->set('Content-Security-Policy', "frame-ancestors 'self'", false);
        $response->headers->set('Cache-Control', $response->headers->get('Cache-Control', 'no-cache, no-store, must-revalidate'), false);

        return $response;
    }
}
