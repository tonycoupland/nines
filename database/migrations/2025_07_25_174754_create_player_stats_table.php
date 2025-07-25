<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('player_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('player_id')->constrained()->onDelete('cascade');
            
            // Game statistics
            $table->integer('games_played')->default(0);
            $table->integer('games_won')->default(0);
            $table->integer('games_lost')->default(0);
            $table->integer('games_abandoned')->default(0);
            
            // Time tracking
            $table->integer('total_time_played_seconds')->default(0); // Total time spent in games
            
            // Streak tracking
            $table->integer('current_days_played_streak')->default(0);
            $table->integer('longest_days_played_streak')->default(0);
            $table->date('last_played_date')->nullable();
            
            $table->integer('current_unbeaten_streak')->default(0); // Wins + draws
            $table->integer('longest_unbeaten_streak')->default(0);
            
            $table->timestamps();
            
            $table->index('player_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_stats');
    }
};
