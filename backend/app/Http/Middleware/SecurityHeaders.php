<?php

/* Proyecto El Santuario
   Creado por Sergio Gómez Barrio — Duartec Instalaciones Informáticas (Burgos, España)
*/

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
        foreach (['X-Powered-By', 'Expires', 'X-Frame-Options'] as $header) {
            header_remove($header);
            $response->headers->remove($header);
        }

        // Add required security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff', false);
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN', false);
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload', false);
        $response->headers->set('Content-Security-Policy', "frame-ancestors 'self'", false);
        if ($request->is('api/*')) {
            $response->headers->set('Cache-Control', 'no-cache, no-store, max-age=0', false);
        } elseif ($request->is('assets/*')) {
            $response->headers->set('Cache-Control', 'public, max-age=31536000, immutable', false);
        } else {
            $response->headers->set('Cache-Control', 'no-cache, no-store, max-age=0', false);
        }

        return $response;
    }
}
