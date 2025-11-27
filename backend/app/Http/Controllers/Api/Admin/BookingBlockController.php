<?php

/* Proyecto El Santuario
   Creado por Sergio Gómez Barrio — Duartec Instalaciones Informáticas (Burgos, España)
*/

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Blocks\StoreBlockRequest;
use App\Models\BookingBlock;
use App\Support\SpaceCache;

class BookingBlockController extends Controller
{
    public function store(StoreBlockRequest $request)
    {
        $block = BookingBlock::create($request->validated());
        SpaceCache::forgetRange($block->space_id, $block->start_at, $block->end_at);

        return response()->json([
            'data' => $block,
        ], 201);
    }
}
