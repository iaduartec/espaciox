<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AttachTokenFromCookie
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->bearerToken() && $request->hasCookie('espaciox_token')) {
            $token = $request->cookie('espaciox_token');
            $request->headers->set('Authorization', 'Bearer '.$token);
        }

        return $next($request);
    }
}
