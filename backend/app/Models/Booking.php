<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Space;
use App\Models\User;
use App\Models\BookingBlock;

class Booking extends Model
{
    use HasFactory;

    const STATUSES = ['pending', 'confirmed', 'cancelled'];
    const DEPOSIT_STATUSES = ['pending', 'paid'];

    protected $fillable = [
        'space_id',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'event_type',
        'start_at',
        'end_at',
        'attendees',
        'comments',
        'status',
        'deposit_amount',
        'deposit_status',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'attendees' => 'integer',
        'deposit_amount' => 'integer',
    ];

    protected $attributes = [
        'status' => 'pending',
        'deposit_status' => 'pending',
        'deposit_amount' => 100,
    ];

    public function space()
    {
        return $this->belongsTo(Space::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function overlaps(int $spaceId, Carbon $start, Carbon $end, ?int $excludeId = null): bool
    {
        $bookingConflict = static::where('space_id', $spaceId)
            ->where('status', '!=', 'cancelled')
            ->where('start_at', '<', $end)
            ->where('end_at', '>', $start)
            ->when($excludeId, fn ($query) => $query->where('id', '!=', $excludeId))
            ->exists();

        if ($bookingConflict) {
            return true;
        }

        return BookingBlock::overlaps($spaceId, $start, $end);
    }
}
