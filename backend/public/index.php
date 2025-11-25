<?php

use Illuminate\Http\Request;
use Throwable;

// Force debug output and visible errors during deploy diagnostics.
putenv('APP_DEBUG=true');
$_ENV['APP_DEBUG'] = 'true';
$_SERVER['APP_DEBUG'] = 'true';
ini_set('display_errors', '1');
error_reporting(E_ALL);

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
    error_log($e->getMessage() . "\n" . $e->getTraceAsString());
    exit(1);
}
