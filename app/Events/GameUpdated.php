<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $gameCode;
    public array $gameState;
    public string $eventType;
    public array $eventData;

    public function __construct(string $gameCode, array $gameState, string $eventType = 'move_made', array $eventData = [])
    {
        $this->gameCode = $gameCode;
        $this->gameState = $gameState;
        $this->eventType = $eventType;
        $this->eventData = $eventData;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel("game.{$this->gameCode}")
        ];
    }

    public function broadcastAs(): string
    {
        return 'game-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'game_state' => $this->gameState,
            'event_type' => $this->eventType,
            'event_data' => $this->eventData
        ];
    }
}
