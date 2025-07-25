<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    protected $fillable = [
        'player_id',
        'nickname',
        'last_seen_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];

    public function stats(): HasOne
    {
        return $this->hasOne(PlayerStats::class);
    }

    public function player1Games(): HasMany
    {
        return $this->hasMany(Game::class, 'player1_id');
    }

    public function player2Games(): HasMany
    {
        return $this->hasMany(Game::class, 'player2_id');
    }

    public function allGames()
    {
        return $this->player1Games()->union($this->player2Games());
    }

    public static function findOrCreateByPlayerId(string $playerId): self
    {
        $player = static::where('player_id', $playerId)->first();
        
        if (!$player) {
            $player = static::create([
                'player_id' => $playerId,
                'last_seen_at' => now(),
            ]);
            
            // Create stats record
            $player->stats()->create();
        } else {
            $player->update(['last_seen_at' => now()]);
        }
        
        return $player;
    }
}
