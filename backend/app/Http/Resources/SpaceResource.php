<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SpaceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => data_get($this->resource, 'id'),
            'name' => data_get($this->resource, 'name'),
            'slug' => data_get($this->resource, 'slug'),
            'capacity' => data_get($this->resource, 'capacity'),
            'is_active' => data_get($this->resource, 'is_active', true),
            'bookings_count' => $this->whenLoaded('bookings', fn () => $this->bookings->count()),
        ];
    }
}
