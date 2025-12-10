<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('ssh.{session}', function ($user, $session) {
    // Allow authenticated users to access SSH terminal sessions
    // In production, you may want to verify the session belongs to the user
    return $user !== null;
});