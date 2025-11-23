<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SpaceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'capacity' => $this->capacity,
            'is_active' => $this->is_active,
            'bookings_count' => $this->whenLoaded('bookings', fn () => $this->bookings->count()),
        ];
    }
}
