<?php

namespace App\\Notifications;

use App\\Models\\Booking;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Notifications\\Notification;
use Illuminate\\Notifications\\Messages\\MailMessage;

class BookingReceivedNotification extends Notification
{
    use Queueable;

    public function __construct(public Booking $booking)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reserva recibida en Espacio X')
            ->greeting('¡Gracias por tu reserva!')
            ->line('Hemos recibido tu solicitud de reserva y la estamos procesando.')
            ->line('Espacio: ' . $this->booking->space->name)
            ->line('Fecha: ' . $this->booking->start_at->format('d/m/Y H:i'))
            ->line('Duración: ' . $this->booking->start_at->diffInHours($this->booking->end_at) . ' horas')
            ->line('Te avisaremos cuando un administrador confirme tu reserva.');
    }
}
