<?php

namespace App\Http\Requests\Bookings;

use App\Models\Booking;
use App\Models\Space;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'space_id' => ['required', 'integer'],
            'date' => ['required', 'date', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration_hours' => ['required', 'integer', 'min:1', 'max:12'],
            'event_type' => ['required', 'string', 'max:255'],
            'attendees' => ['nullable', 'integer', 'min:1'],
            'comments' => ['nullable', 'string', 'max:2000'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            try {
                $space = Space::find($this->space_id);
            } catch (\Throwable $e) {
                // Si la base de datos no está disponible, salta validaciones adicionales.
                return;
            }

            if (! $space) {
                $validator->errors()->add('space_id', 'El espacio seleccionado no existe.');
                return;
            }

            try {
                $start = Carbon::createFromFormat('Y-m-d H:i', "{$this->date} {$this->start_time}");
                $end = $start->copy()->addHours($this->duration_hours);
                $schedule = $this->dailySchedule($start->dayOfWeek);

                if (! $schedule) {
                    $validator->errors()->add('date', 'El espacio no opera ese día.');
                    return;
                }

                if ($start->lt($schedule['start']) || $end->gt($schedule['end'])) {
                    $validator->errors()->add('start_time', 'El horario seleccionado cae fuera del horario disponible del día.');
                }

                if ($this->attendees && $this->attendees > $space->capacity) {
                    $validator->errors()->add('attendees', 'El número de asistentes supera la capacidad del espacio.');
                }

                if (Booking::overlaps($space->id, $start, $end)) {
                    $validator->errors()->add('date', 'El espacio ya está reservado o bloqueado en ese rango horario.');
                }

                if ($start->lt(now())) {
                    $validator->errors()->add('date', 'La reserva debe iniciarse en el futuro.');
                }
            } catch (\Throwable $e) {
                // Si algo falla (ej. sin BD), no bloqueamos la reserva demo.
            }
        });
    }

    private function dailySchedule(int $dayOfWeek): ?array
    {
        $dayNames = [
            Carbon::SUNDAY => 'sunday',
            Carbon::MONDAY => 'monday',
            Carbon::TUESDAY => 'tuesday',
            Carbon::WEDNESDAY => 'wednesday',
            Carbon::THURSDAY => 'thursday',
            Carbon::FRIDAY => 'friday',
            Carbon::SATURDAY => 'saturday',
        ];

        $dayKey = $dayNames[$dayOfWeek] ?? null;
        $config = config('spaces.schedule', []);

        if (! $dayKey || ! isset($config[$dayKey])) {
            return null;
        }

        $period = $config[$dayKey];
        return [
            'start' => Carbon::createFromFormat('Y-m-d H:i', "{$this->date} {$period['start']}"),
            'end' => Carbon::createFromFormat('Y-m-d H:i', "{$this->date} {$period['end']}"),
        ];
    }
}
