<?php

namespace App\Http\Controllers\Backend\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    /**
     * Display the notifications settings page.
     */
    public function index(): Response
    {
        return Inertia::render('Backend/Settings/notifications/index');
    }
}
