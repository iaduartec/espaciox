<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailabilitySlotResource extends JsonResource
{
    public function toArray($request): array
    {
        // Resource may be an array, so use $this->resource to avoid property access errors.
        $start = data_get($this->resource, 'start');
        $end = data_get($this->resource, 'end');

        return [
            'start_time' => $start ? Carbon::parse($start)->format('H:i') : null,
            'end_time' => $end ? Carbon::parse($end)->format('H:i') : null,
            'status' => data_get($this->resource, 'status', 'free'),
            'label' => data_get($this->resource, 'label'),
        ];
    }
}
