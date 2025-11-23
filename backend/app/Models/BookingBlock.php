<?php

namespace App\\Models;

use Carbon\\Carbon;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use App\\Models\\Space;

class BookingBlock extends Model
{
    use HasFactory;

    protected $fillable = [
        'space_id',
        'start_at',
        'end_at',
        'reason',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function space()
    {
        return $this->belongsTo(Space::class);
    }

    public static function overlaps(int $spaceId, Carbon $start, Carbon $end): bool
    {
        return static::where('space_id', $spaceId)
            ->where('start_at', '<', $end)
            ->where('end_at', '>', $start)
            ->exists();
    }
}
