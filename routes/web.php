<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->file(public_path('index.html'));
});

Route::get('/join/{code}', function ($code) {
    return response()->file(public_path('index.html'));
});

// Exclude static assets and API paths from catch-all route
Route::get('/{any}', function () {
    return response()->file(public_path('index.html'));
})->where('any', '^(?!api/)(?!.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)).*$');
