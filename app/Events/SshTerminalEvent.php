<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SshTerminalEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $sessionId;
    public string $output;
    public ?string $error;

    /**
     * Create a new event instance.
     */
    public function __construct(string $sessionId, string $output = '', ?string $error = null)
    {
        Log::info('ssh terminal event');
        $this->sessionId = $sessionId;
        $this->output = $output;
        $this->error = $error;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new PrivateChannel('ssh.' . $this->sessionId);
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'terminal.output';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'output' => $this->output,
            'error' => $this->error,
        ];
    }
}
