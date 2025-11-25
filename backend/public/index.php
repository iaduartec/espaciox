<?php

use Illuminate\Http\Request;
use Throwable;

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

try {
    $response = $kernel->handle(
        $request = Request::capture()
    );

    $response->send();

    $kernel->terminate($request, $response);
} catch (Throwable $e) {
    http_response_code(500);
    echo "Bootstrap exception: " . $e->getMessage();
    error_log($e);
    throw $e;
}
