<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Game extends Model
{
    protected $fillable = [
        'code',
        'player1_id',
        'player2_id', 
        'game_state',
        'status',
        'winner',
        'last_move_at',
        'move_count',
        'started_at',
        'ended_at',
        'end_reason',
        'winner_symbol'
    ];

    protected $casts = [
        'game_state' => 'array',
        'last_move_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime'
    ];

    public static function generateCode(): string
    {
        do {
            $code = strtoupper(Str::random(4));
        } while (self::where('code', $code)->exists());
        
        return $code;
    }

    public function initializeGameState(): array
    {
        return [
            'grids' => array_fill(0, 9, array_fill(0, 9, null)),
            'grid_winners' => array_fill(0, 9, null),
            'current_player' => 'X',
            'active_grid' => null,
            'game_over' => false,
            'winner' => null
        ];
    }

    public function isPlayerInGame(string $playerId): bool
    {
        return $this->player1_id === $playerId || $this->player2_id === $playerId;
    }

    public function getPlayerSymbol(string $playerId): ?string
    {
        if ($this->player1_id === $playerId) return 'X';
        if ($this->player2_id === $playerId) return 'O';
        return null;
    }
}
