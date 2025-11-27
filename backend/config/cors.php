<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://elsantuario.com',
        'https://www.elsantuario.com',
        'https://espaciox.infinityfreeapp.com',
        'https://espaciox.vercel.app',
        'https://iaduartec.github.io/espaciox/reservas.html',
        'https://iaduartec.github.io',
        'http://localhost:8000',
        'http://localhost:3000',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
