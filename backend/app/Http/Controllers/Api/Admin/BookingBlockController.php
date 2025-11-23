<?php

namespace App\\Http\\Controllers\\Api\\Admin;

use App\\Http\\Controllers\\Controller;
use App\\Http\\Requests\\Blocks\\StoreBlockRequest;
use App\\Models\\BookingBlock;

class BookingBlockController extends Controller
{
    public function store(StoreBlockRequest $request)
    {
        $block = BookingBlock::create($request->validated());

        return response()->json([
            'data' => $block,
        ], 201);
    }
}
