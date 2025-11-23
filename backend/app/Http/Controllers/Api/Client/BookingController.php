<?php

namespace App\\Http\\Controllers\\Api\\Client;

use App\\Http\\Controllers\\Controller;
use App\\Http\\Requests\\Bookings\\StoreBookingRequest;
use App\\Http\\Resources\\BookingResource;
use App\\Models\\Booking;
use App\\Notifications\\BookingReceivedNotification;
use App\\Notifications\\BookingStatusNotification;
use Carbon\\Carbon;
use Illuminate\\Http\\Request;
use Illuminate\\Http\\Response;

class BookingController extends Controller
{
    public function store(StoreBookingRequest $request)
    {
        $user = $request->user();
        $start = Carbon::createFromFormat('Y-m-d H:i', "{$request->date} {$request->start_time}");
        $end = $start->copy()->addHours($request->duration_hours);

        $booking = Booking::create([
            'space_id' => $request->space_id,
            'user_id' => $user->id,
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => $user->phone ?? '',
            'event_type' => $request->event_type,
            'start_at' => $start,
            'end_at' => $end,
            'attendees' => $request->attendees,
            'comments' => $request->comments,
        ]);

        $booking->load('space');

        $user->notify(new BookingReceivedNotification($booking));

        return BookingResource::make($booking);
    }

    public function index(Request $request)
    {
        $bookings = $request->user()
            ->bookings()
            ->with('space')
            ->orderBy('start_at', 'desc')
            ->get();

        return BookingResource::collection($bookings);
    }

    public function show(Request $request, Booking $booking)
    {
        abort_unless($request->user()->id === $booking->user_id, 403);

        return BookingResource::make($booking->load('space'));
    }

    public function cancel(Request $request, Booking $booking)
    {
        abort_unless($request->user()->id === $booking->user_id, 403);

        if ($booking->start_at->lte(now())) {
            return response()->json(['message' => 'Solo se pueden cancelar reservas futuras'], 422);
        }

        $booking->update(['status' => 'cancelled']);
        $booking->load('space');
        $booking->user?->notify(new BookingStatusNotification($booking));

        return BookingResource::make($booking);
    }
}
