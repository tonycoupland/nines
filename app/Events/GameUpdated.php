<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $game;

    public function __construct($game)
    {
        $this->game = $game;
    }

    public function broadcastOn(): array
    {
        $gameCode = is_object($this->game) && isset($this->game->code) 
            ? $this->game->code 
            : $this->game['game']['code'];
            
        return [
            new Channel("game.{$gameCode}")
        ];
    }

    public function broadcastAs(): string
    {
        return 'game-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'game' => $this->game
        ];
    }
}
