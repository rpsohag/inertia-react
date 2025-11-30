<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Backend\Dashboard\DashboardController;
use App\Http\Controllers\Backend\Auth\LoginController;
use App\Http\Controllers\Backend\Users\UsersController;

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
    Route::post('users/bulk-delete', [UsersController::class, 'bulkDelete'])->name('users.bulk-delete');
    Route::post('users/import', [UsersController::class, 'import'])->name('users.import');
    Route::resource('users', UsersController::class);
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');
});
    