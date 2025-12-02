<?php

namespace App\Http\Controllers\Backend\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    /**
     * Display the account settings page.
     */
    public function index(): Response
    {
        return Inertia::render('Backend/Settings/account/index');
    }
}
