<?php

namespace App\\Notifications;

use App\\Models\\Booking;
use Illuminate\\Bus\\Queueable;
use Illuminate\\Notifications\\Notification;
use Illuminate\\Notifications\\Messages\\MailMessage;

class BookingStatusNotification extends Notification
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
        $mail = new MailMessage();

        if ($this->booking->status === 'confirmed') {
            $mail->subject('Tu reserva ha sido confirmada')
                ->greeting('¡Reserva confirmada!')
                ->line('Tu reserva ha sido confirmada por el equipo de Espacio X.');
        } else {
            $mail->subject('Tu reserva ha sido cancelada')
                ->greeting('Reserva cancelada')
                ->line('Lamentamos informarte que la reserva ha sido cancelada.');
        }

        $mail->line('Espacio: ' . $this->booking->space->name)
            ->line('Fecha: ' . $this->booking->start_at->format('d/m/Y H:i'))
            ->line('Duración: ' . $this->booking->start_at->diffInHours($this->booking->end_at) . ' horas');

        return $mail;
    }
}
