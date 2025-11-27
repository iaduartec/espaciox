<?php

return [
    'stateful' => array_unique(array_filter(array_map('trim', explode(',', env(
        'SANCTUM_STATEFUL_DOMAINS',
        'localhost,127.0.0.1,localhost:8000,localhost:8001,127.0.0.1:8000,127.0.0.1:8001,espaciox.vercel.app'
    ))))),
    'expiration' => (int) env('SANCTUM_EXPIRATION', 120),
    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
    ],
];
