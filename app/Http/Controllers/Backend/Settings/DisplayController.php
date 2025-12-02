<?php

namespace App\Http\Controllers\Backend\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DisplayController extends Controller
{
    /**
     * Display the display settings page.
     */
    public function index(): Response
    {
        return Inertia::render('Backend/Settings/display/index');
    }
}
