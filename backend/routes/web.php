<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->file(base_path('../dist/index.html'));
});

Route::get('/join/{code}', function ($code) {
    return response()->file(base_path('../dist/index.html'));
});

Route::get('/{any}', function () {
    return response()->file(base_path('../dist/index.html'));
})->where('any', '.*');
