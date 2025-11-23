<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
class AvailabilitySlotResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'start_time' => optional($this->start)->format('H:i'),
            'end_time' => optional($this->end)->format('H:i'),
            'status' => $this->status ?? 'free',
            'label' => $this->label ?? null,
        ];
    }
}
