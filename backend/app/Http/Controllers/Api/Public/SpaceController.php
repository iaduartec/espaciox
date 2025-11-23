<?php

namespace App\\Http\\Controllers\\Api\\Public;

use App\\Http\\Controllers\\Controller;
use App\\Http\\Resources\\AvailabilitySlotResource;
use App\\Http\\Resources\\CalendarDayResource;
use App\\Http\\Resources\\SpaceResource;
use App\\Models\\Booking;
use App\\Models\\BookingBlock;
use App\\Models\\Space;
use Carbon\\Carbon;
use Illuminate\\Support\\Collection;
use Illuminate\\Http\\Request;

class SpaceController extends Controller
{
    public function index()
    {
        $spaces = Space::where('is_active', true)->get();

        return SpaceResource::collection($spaces);
    }

    public function calendar(Request $request, Space $space)
    {
        $month = $request->query('month', Carbon::now()->format('Y-m'));
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $bookings = $space->bookings()
            ->where('status', '!=', 'cancelled')
            ->whereBetween('start_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->get();

        $blocks = $space->bookingBlocks()
            ->whereBetween('start_at', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->get();

        $days = [];
        $current = $start->copy();

        while ($current->lte($end)) {
            $dayBookings = $bookings->filter(fn ($booking) => $booking->start_at->isSameDay($current));
            $dayBlocks = $blocks->filter(fn ($block) => $block->start_at->isSameDay($current));

            $status = 'free';
            $reason = null;

            if ($dayBlocks->isNotEmpty()) {
                $status = 'blocked';
                $reason = $dayBlocks->first()->reason;
            } elseif ($dayBookings->isNotEmpty()) {
                $status = 'booked';
            }

            $days[] = [
                'date' => $current->toDateString(),
                'status' => $status,
                'bookings' => $dayBookings->count(),
                'blocks' => $dayBlocks->count(),
                'reason' => $reason,
            ];

            $current->addDay();
        }

        return CalendarDayResource::collection(collect($days));
    }

    public function availability(Request $request, Space $space)
    {
        $date = $request->query('date', Carbon::now()->toDateString());
        $day = Carbon::createFromFormat('Y-m-d', $date);
        $schedule = $this->scheduleForDay($day);

        if (! $schedule) {
            return response()->json(['message' => 'El espacio no opera ese día'], 422);
        }

        $slots = [];
        $periodStart = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$schedule['start']}");
        $periodEnd = Carbon::createFromFormat('Y-m-d H:i', "{$date} {$schedule['end']}");

        $bookings = $space->bookings()
            ->where('status', '!=', 'cancelled')
            ->whereBetween('start_at', [$periodStart, $periodEnd])
            ->get();

        $blocks = $space->bookingBlocks()
            ->whereBetween('start_at', [$periodStart, $periodEnd])
            ->get();

        $slotStart = $periodStart->copy();

        while ($slotStart->lt($periodEnd)) {
            $slotEnd = $slotStart->copy()->addHour();
            if ($slotEnd->gt($periodEnd)) {
                break;
            }

            $slots[] = [
                'start' => $slotStart->copy(),
                'end' => $slotEnd->copy(),
                'status' => $this->evaluateSlot($slotStart, $slotEnd, $bookings, $blocks),
            ];

            $slotStart->addHour();
        }

        return AvailabilitySlotResource::collection(collect($slots));
    }

    private function scheduleForDay(Carbon $day): ?array
    {
        $dayKey = strtolower($day->format('l'));
        $schedule = config('spaces.schedule', []);

        return $schedule[$dayKey] ?? null;
    }

    private function evaluateSlot(Carbon $start, Carbon $end, Collection $bookings, Collection $blocks): string
    {
        foreach ($blocks as $block) {
            if ($block->start_at->lt($end) && $block->end_at->gt($start)) {
                return 'blocked';
            }
        }

        foreach ($bookings as $booking) {
            if ($booking->start_at->lt($end) && $booking->end_at->gt($start)) {
                return 'booked';
            }
        }

        return 'free';
    }
}
