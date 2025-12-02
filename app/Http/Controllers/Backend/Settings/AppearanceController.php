<?php

namespace App\Http\Controllers\Backend\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AppearanceController extends Controller
{
    /**
     * Display the appearance settings page.
     */
    public function index(): Response
    {
        return Inertia::render('Backend/Settings/appearance/index');
    }
}
