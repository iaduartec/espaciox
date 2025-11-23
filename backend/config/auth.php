<?php

return [
    'defaults' => [
        'guard' => env('AUTH_DEFAULT_GUARD', 'web'),
        'passwords' => env('AUTH_DEFAULT_PASSWORDS', 'users'),
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],

        'api' => [
            'driver' => env('AUTH_API_DRIVER', 'sanctum'),
            'provider' => env('AUTH_API_PROVIDER', 'users'),
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\\Models\\User::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => env('AUTH_PASSWORD_PROVIDER', 'users'),
            'table' => env('AUTH_PASSWORD_TABLE', 'password_resets'),
            'expire' => (int) env('AUTH_PASSWORD_EXPIRE', 60),
            'throttle' => env('AUTH_PASSWORD_THROTTLE', 60),
        ],
    ],
];
