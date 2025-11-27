<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201)->cookie($this->tokenCookie($token));
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ])->cookie($this->tokenCookie($token));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sesión cerrada'])
            ->withoutCookie('espaciox_token');
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    protected function tokenCookie(string $token)
    {
        $minutes = 60 * 24 * 30;
        $secure = (bool) config('session.secure', app()->environment('production'));
        $sameSite = config('session.same_site', 'lax') ?: 'lax';

        return cookie(
            'espaciox_token',
            $token,
            $minutes,
            '/',
            config('session.domain'),
            $secure,
            true,
            false,
            $sameSite
        );
    }
}
