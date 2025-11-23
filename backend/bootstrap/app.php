cat > backend/bootstrap/app.php <<'PHP'
<?php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))

    // Rutas: web, consola, health y API
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    // Middleware y aliases (Laravel 11/12)
    ->withMiddleware(function (Middleware $middleware): void {

        // Si quieres personalizar el grupo api, deja SubstituteBindings como base
        $middleware->api(append: [
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // Alias de middleware de ruta
        $middleware->alias([
            'is_admin' => \App\Http\Middleware\IsAdmin::class,
        ]);
    })

    // Excepciones (lo dejamos default)
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })

    ->create();
?>
