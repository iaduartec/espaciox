<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\SpaceResource;

class BookingResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'space' => new SpaceResource($this->whenLoaded('space')),
            'user_id' => $this->user_id,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'customer_phone' => $this->customer_phone,
            'event_type' => $this->event_type,
            'start_at' => $this->start_at->toDateTimeString(),
            'end_at' => $this->end_at->toDateTimeString(),
            'attendees' => $this->attendees,
            'comments' => $this->comments,
            'status' => $this->status,
            'deposit_amount' => $this->deposit_amount,
            'deposit_status' => $this->deposit_status,
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
