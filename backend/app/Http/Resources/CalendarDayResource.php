<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CalendarDayResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'date' => data_get($this, 'date'),
            'status' => data_get($this, 'status', 'free'),
            'bookings' => data_get($this, 'bookings', 0),
            'blocks' => data_get($this, 'blocks', 0),
            'reason' => data_get($this, 'reason'),
        ];
    }
}
