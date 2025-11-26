<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Backend\Dashboard\DashboardController;
use App\Http\Controllers\Backend\Auth\LoginController;

Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');

Route::get('/about', function(){
    return Inertia::render('About');
})->name('about');

Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');
});
    