<?php

/* Proyecto El Santuario
   Creado por Sergio Gómez Barrio — Duartec Instalaciones Informáticas (Burgos, España)
*/

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://espaciox.vercel.app',
        'https://iaduartec.github.io',
        'https://elsantuario.com',
        'https://www.elsantuario.com',
        'http://localhost:8000',
        'http://localhost:8001',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:8001',
    ],
    'allowed_origins_patterns' => [
        '#^https://espaciox-[^.]+\\.vercel\\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
