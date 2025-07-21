<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/config', function () {
    return response()->json([
        'reverb' => [
            'key' => env('VITE_REVERB_APP_KEY', 'local-key'),
            'host' => env('VITE_REVERB_HOST', 'localhost'),
            'port' => env('VITE_REVERB_PORT', 8081),
            'scheme' => env('VITE_REVERB_SCHEME', 'http')
        ]
    ]);
});

Route::post('/games', [GameController::class, 'createGame']);
Route::post('/games/{code}/join', [GameController::class, 'joinGame']);
Route::post('/games/{code}/move', [GameController::class, 'makeMove']);
Route::get('/games/{code}', [GameController::class, 'getGame']);
Route::get('/games/{code}/qr', [GameController::class, 'getQrCode']);