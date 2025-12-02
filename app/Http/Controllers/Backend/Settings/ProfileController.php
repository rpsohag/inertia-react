<?php

namespace App\Http\Controllers\Backend\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the profile settings page.
     */
    public function index(): Response
    {
        return Inertia::render('Backend/Settings/profile/index');
    }
}
