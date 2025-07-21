<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/config', function () {
    // Detect if we're in production based on APP_ENV or domain
    $isProduction = env('APP_ENV') === 'production' || 
                   request()->getHost() !== 'localhost';
    
    return response()->json([
        'reverb' => [
            'key' => env('VITE_REVERB_APP_KEY', 'local-key'),
            'host' => $isProduction ? request()->getHost() : env('VITE_REVERB_HOST', 'localhost'),
            'port' => $isProduction ? 443 : env('VITE_REVERB_PORT', 8081),
            'scheme' => $isProduction ? 'https' : env('VITE_REVERB_SCHEME', 'http')
        ]
    ]);
});

Route::post('/games', [GameController::class, 'createGame']);
Route::post('/games/{code}/join', [GameController::class, 'joinGame']);
Route::post('/games/{code}/move', [GameController::class, 'makeMove']);
Route::get('/games/{code}', [GameController::class, 'getGame']);
Route::get('/games/{code}/qr', [GameController::class, 'getQrCode']);

// Test broadcast endpoint
Route::post('/test-broadcast', function() {
    $testData = [
        'message' => 'Test broadcast at ' . now(),
        'timestamp' => time()
    ];
    
    error_log('Broadcasting test message to channel: test-channel');
    error_log('Test data: ' . json_encode($testData));
    
    broadcast(new \App\Events\TestBroadcast($testData));
    
    return response()->json([
        'success' => true,
        'message' => 'Test broadcast sent',
        'data' => $testData
    ]);
});