<?php

use App\Http\Controllers\Backend\Auth\LoginController;
use App\Http\Controllers\Backend\Dashboard\DashboardController;
use App\Http\Controllers\Backend\Settings\AccountController;
use App\Http\Controllers\Backend\Settings\AppearanceController;
use App\Http\Controllers\Backend\Settings\DisplayController;
use App\Http\Controllers\Backend\Settings\NotificationsController;
use App\Http\Controllers\Backend\Settings\ProfileController;
use App\Http\Controllers\Backend\SSH\SshManagementController;
use App\Http\Controllers\Backend\Users\UsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');

Route::get('/about', function () {
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

    Route::prefix('ssh')->name('ssh.')->controller(SshManagementController::class)->group(function () {
        Route::get('/servers', 'servers')->name('servers');
        Route::post('/servers/bulk-delete', 'bulkDelete')->name('servers.bulk-delete');
        Route::post('/servers', 'store')->name('servers.store');
        Route::put('/servers/{server}', 'update')->name('servers.update');
        Route::delete('/servers/{server}', 'destroy')->name('servers.destroy');

        Route::get('/ssh-keys', 'sshKeys')->name('ssh-keys');
        Route::post('/ssh-keys/bulk-delete', 'bulkDeleteSshKeys')->name('ssh-keys.bulk-delete');
        Route::post('/ssh-keys', 'storeSshKey')->name('ssh-keys.store');
        Route::put('/ssh-keys/{sshKey}', 'updateSshKey')->name('ssh-keys.update');
        Route::delete('/ssh-keys/{sshKey}', 'destroySshKey')->name('ssh-keys.destroy');
    });

    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');
});
