<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TestBroadcast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function broadcastOn(): array
    {
        error_log("Broadcasting on channel: test-channel");
        return [
            new Channel('test-channel')
        ];
    }

    public function broadcastAs(): string
    {
        return 'test-message';
    }

    public function broadcastWith(): array
    {
        error_log("Broadcasting test data: " . json_encode($this->data));
        return $this->data;
    }
}