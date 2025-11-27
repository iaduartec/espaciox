<?php

/* Proyecto El Santuario
   Creado por Sergio Gómez Barrio — Duartec Instalaciones Informáticas (Burgos, España)
*/

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class SpaceCache
{
    public static function forget(int $spaceId, Carbon $date): void
    {
        Cache::forget(sprintf('spaces:%s:availability:%s', $spaceId, $date->toDateString()));
        Cache::forget(sprintf('spaces:%s:calendar:%s', $spaceId, $date->format('Y-m')));
    }

    public static function forgetRange(int $spaceId, Carbon $start, Carbon $end): void
    {
        self::forget($spaceId, $start);

        if (! $start->isSameDay($end)) {
            self::forget($spaceId, $end);
        }
    }
}
