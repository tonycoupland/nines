<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class PlayerStats extends Model
{
    protected $fillable = [
        'player_id',
        'games_played',
        'games_won',
        'games_lost',
        'games_abandoned',
        'total_time_played_seconds',
        'current_days_played_streak',
        'longest_days_played_streak',
        'last_played_date',
        'current_unbeaten_streak',
        'longest_unbeaten_streak',
    ];

    protected $casts = [
        'last_played_date' => 'date',
    ];

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function recordGameResult(string $result, int $gameDurationSeconds = 0): void
    {
        $today = Carbon::today();
        $wasPlayedToday = $this->last_played_date && $this->last_played_date->eq($today);
        
        // Update basic stats
        $this->games_played++;
        $this->total_time_played_seconds += $gameDurationSeconds;
        
        // Update win/loss/abandon stats
        switch ($result) {
            case 'win':
                $this->games_won++;
                $this->current_unbeaten_streak++;
                $this->longest_unbeaten_streak = max($this->longest_unbeaten_streak, $this->current_unbeaten_streak);
                break;
            case 'loss':
                $this->games_lost++;
                $this->current_unbeaten_streak = 0;
                break;
            case 'draw':
                // Draw doesn't break unbeaten streak
                $this->current_unbeaten_streak++;
                $this->longest_unbeaten_streak = max($this->longest_unbeaten_streak, $this->current_unbeaten_streak);
                break;
            case 'abandon':
                $this->games_abandoned++;
                $this->current_unbeaten_streak = 0;
                break;
        }
        
        // Update daily streak
        if (!$wasPlayedToday) {
            if ($this->last_played_date && $this->last_played_date->eq($today->subDay())) {
                // Played yesterday, continue streak
                $this->current_days_played_streak++;
            } else {
                // New streak starts
                $this->current_days_played_streak = 1;
            }
            
            $this->longest_days_played_streak = max($this->longest_days_played_streak, $this->current_days_played_streak);
            $this->last_played_date = $today;
        }
        
        $this->save();
    }
}
