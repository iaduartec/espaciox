<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailabilitySlotResource extends JsonResource
{
    public function toArray($request): array
    {
        $start = data_get($this, 'start');
        $end = data_get($this, 'end');

        return [
            'start_time' => $start ? Carbon::parse($start)->format('H:i') : null,
            'end_time' => $end ? Carbon::parse($end)->format('H:i') : null,
            'status' => data_get($this, 'status', 'free'),
            'label' => data_get($this, 'label'),
        ];
    }
}
