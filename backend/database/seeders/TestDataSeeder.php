<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Space;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Admin demo
        $admin = User::firstOrCreate(
            ['email' => 'admin@espaciox.demo'],
            [
                'name' => 'Admin Demo',
                'phone' => '600000001',
                'password' => Hash::make('admin123'),
                'is_admin' => true,
            ]
        );

        // Cliente demo
        $client = User::firstOrCreate(
            ['email' => 'cliente@espaciox.demo'],
            [
                'name' => 'Cliente Demo',
                'phone' => '600000002',
                'password' => Hash::make('cliente123'),
                'is_admin' => false,
            ]
        );

        // Espacio principal
        $space = Space::firstOrCreate(
            ['slug' => 'sala-principal'],
            [
                'name' => 'EspacioX - Sala Principal',
                'capacity' => 40,
                'is_active' => true,
            ]
        );

        // Reservas demo (una confirmada y otra pendiente)
        Booking::firstOrCreate(
            [
                'space_id' => $space->id,
                'start_at' => Carbon::now()->addDays(3)->setTime(17,0),
            ],
            [
                'user_id' => $client->id,
                'customer_name' => $client->name,
                'customer_email' => $client->email,
                'customer_phone' => $client->phone,
                'event_type' => 'cumpleaños infantil',
                'end_at' => Carbon::now()->addDays(3)->setTime(20,0),
                'attendees' => 15,
                'status' => 'confirmed',
                'deposit_amount' => 100,
                'deposit_status' => 'paid',
            ]
        );

        Booking::firstOrCreate(
            [
                'space_id' => $space->id,
                'start_at' => Carbon::now()->addDays(5)->setTime(11,0),
            ],
            [
                'user_id' => $client->id,
                'customer_name' => $client->name,
                'customer_email' => $client->email,
                'customer_phone' => $client->phone,
                'event_type' => 'reunión familiar',
                'end_at' => Carbon::now()->addDays(5)->setTime(13,0),
                'attendees' => 8,
                'status' => 'pending',
                'deposit_amount' => 100,
                'deposit_status' => 'pending',
            ]
        );
    }
}
