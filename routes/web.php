<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Backend\Dashboard\DashboardController;
use App\Http\Controllers\Backend\Auth\LoginController;
use App\Http\Controllers\Backend\Users\UsersController;
use App\Http\Controllers\Backend\Settings\ProfileController;
use App\Http\Controllers\Backend\Settings\AccountController;
use App\Http\Controllers\Backend\Settings\AppearanceController;
use App\Http\Controllers\Backend\Settings\NotificationsController;
use App\Http\Controllers\Backend\Settings\DisplayController;

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
    
    // Settings routes
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/profile', [ProfileController::class, 'index'])->name('profile');
        Route::get('/account', [AccountController::class, 'index'])->name('account');
        Route::get('/appearance', [AppearanceController::class, 'index'])->name('appearance');
        Route::get('/notifications', [NotificationsController::class, 'index'])->name('notifications');
        Route::get('/display', [DisplayController::class, 'index'])->name('display');
    });
    
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');
});
    