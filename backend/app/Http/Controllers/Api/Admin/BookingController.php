<?php

namespace App\\Http\\Controllers\\Api\\Admin;

use App\\Http\\Controllers\\Controller;
use App\\Http\\Resources\\BookingResource;
use App\\Models\\Booking;
use App\\Notifications\\BookingStatusNotification;
use Illuminate\\Http\\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with(['space', 'user']);

        if ($request->filled('from')) {
            $query->where('start_at', '>=', $request->query('from'));
        }

        if ($request->filled('to')) {
            $query->where('end_at', '<=', $request->query('to'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        return BookingResource::collection($query->orderBy('start_at')->get());
    }

    public function confirm(Booking $booking)
    {
        $booking->update(['status' => 'confirmed']);
        $booking->load(['space', 'user']);
        $booking->user?->notify(new BookingStatusNotification($booking));

        return BookingResource::make($booking);
    }

    public function cancel(Booking $booking)
    {
        $booking->update(['status' => 'cancelled']);
        $booking->load(['space', 'user']);
        $booking->user?->notify(new BookingStatusNotification($booking));

        return BookingResource::make($booking);
    }
}
