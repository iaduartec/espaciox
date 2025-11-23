<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost')),
    'expiration' => env('SANCTUM_EXPIRATION', 120),
    'middleware' => [
        'verify_csrf_token' => App\\Http\\Middleware\\VerifyCsrfToken::class,
        'encrypt_cookies' => Illuminate\\Cookie\\Middleware\\EncryptCookies::class,
    ],
];
