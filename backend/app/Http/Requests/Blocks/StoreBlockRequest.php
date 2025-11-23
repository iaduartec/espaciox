<?php

namespace App\\Http\\Requests\\Blocks;

use App\\Models\\BookingBlock;
use Illuminate\\Foundation\\Http\\FormRequest;
use Illuminate\\Contracts\\Validation\\Validator as ValidatorContract;
use Carbon\\Carbon;

class StoreBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'space_id' => ['required', 'integer', 'exists:spaces,id'],
            'start_at' => ['required', 'date', 'date_format:Y-m-d H:i'],
            'end_at' => ['required', 'date', 'date_format:Y-m-d H:i'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $start = Carbon::createFromFormat('Y-m-d H:i', $this->start_at);
            $end = Carbon::createFromFormat('Y-m-d H:i', $this->end_at);

            if ($start->gte($end)) {
                $validator->errors()->add('end_at', 'La fecha de fin debe ser mayor que la de inicio.');
            }

            if ($start->lt(now())) {
                $validator->errors()->add('start_at', 'El bloqueo debe comenzar en el futuro.');
            }

            if (BookingBlock::overlaps((int) $this->space_id, $start, $end)) {
                $validator->errors()->add('space_id', 'Ya existe un bloqueo en ese horario.');
            }
        });
    }
}
