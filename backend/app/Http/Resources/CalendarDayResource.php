<?php

namespace App\\Http\\Resources;

use Illuminate\\Http\\Resources\\Json\\JsonResource;

class CalendarDayResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'date' => $this->date, 
            'status' => $this->status ?? 'free',
            'bookings' => $this->bookings ?? 0,
            'blocks' => $this->blocks ?? 0,
            'reason' => $this->reason ?? null,
        ];
    }
}
