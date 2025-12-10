<?php

namespace App\Listeners;

use App\Services\SshSession;
use Illuminate\Support\Facades\Cache;

class HandleSshInput
{
    public function handle($event)
    {
        $sessionId = $event->payload['session'];
        $input = $event->payload['input'];

        $session = Cache::rememberForever("ssh_session_{$sessionId}", function () {
            return new SshSession(
                host: 'your-host-ip',
                port: 22,
                user: 'root',
                pass: 'password'
            );
        });

        $output = $session->write($input);

        broadcast(new \App\Events\SshOutput($sessionId, $output));
    }
}
