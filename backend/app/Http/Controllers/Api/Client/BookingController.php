<?php

/* Proyecto El Santuario
   Creado por Sergio Gómez Barrio — Duartec Instalaciones Informáticas (Burgos, España)
*/

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Bookings\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Space;
use App\Notifications\BookingReceivedNotification;
use App\Notifications\BookingStatusNotification;
use App\Support\SpaceCache;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function store(StoreBookingRequest $request)
    {
        $user = $request->user();
        $customerName = $user->name ?? $request->input('customer_name') ?? $request->input('name') ?? 'Invitado';
        $customerEmail = $user->email ?? $request->input('customer_email') ?? $request->input('email') ?? 'invitado@example.test';
        $customerPhone = $user->phone ?? $request->input('customer_phone') ?? $request->input('phone') ?? '';
        $start = Carbon::createFromFormat('Y-m-d H:i', "{$request->date} {$request->start_time}");
        $end = $start->copy()->addHours($request->duration_hours);

        $space = null;
        try {
            $space = Space::find($request->space_id);
        } catch (\Throwable $e) {
            // Si la base de datos no está disponible, seguimos al modo demo.
        }

        if ($space?->is_active === false) {
            return response()->json(['message' => 'El espacio no está disponible para reservas.'], 422);
        }

        if ($space && Booking::overlaps($space->id, $start, $end)) {
            return response()->json(['message' => 'Ese horario se acaba de ocupar. Elige otro intervalo.'], 409);
        }

        try {
            $booking = Booking::create([
                'space_id' => $request->space_id,
                'user_id' => $user?->id,
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'customer_phone' => $customerPhone,
                'event_type' => $request->event_type,
                'start_at' => $start,
                'end_at' => $end,
                'attendees' => $request->attendees,
                'comments' => $request->comments,
            ]);

            $booking->load('space');
            SpaceCache::forgetRange($booking->space_id, $start, $end);

            if ($user) {
                $user->notify(new BookingReceivedNotification($booking));
            }

            return BookingResource::make($booking);
        } catch (\Throwable $e) {
            // Fallback sin BD: devolver eco de la solicitud.
            return response()->json([
                'data' => [
                    'id' => 0,
                    'space_id' => (int) $request->space_id,
                    'customer_name' => $customerName,
                    'customer_email' => $customerEmail,
                    'customer_phone' => $customerPhone,
                    'event_type' => $request->event_type,
                    'start_at' => $start,
                    'end_at' => $end,
                    'attendees' => $request->attendees,
                    'comments' => $request->comments,
                    'status' => 'pending',
                ],
                'message' => 'Reserva recibida en modo demostración',
            ], 201);
        }
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
        SpaceCache::forgetRange($booking->space_id, $booking->start_at, $booking->end_at);

        return BookingResource::make($booking);
    }
}
