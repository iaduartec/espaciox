<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Booking;
use App\Models\BookingBlock;

class Space extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'capacity',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function bookingBlocks()
    {
        return $this->hasMany(BookingBlock::class);
    }
}
