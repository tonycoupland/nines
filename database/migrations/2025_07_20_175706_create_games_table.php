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
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('code', 6)->unique(); // Short shareable code
            $table->string('player1_id')->nullable(); // Session/socket ID of player 1
            $table->string('player2_id')->nullable(); // Session/socket ID of player 2
            $table->json('game_state'); // 9x9 grid state + current player + active grid
            $table->enum('status', ['waiting', 'playing', 'finished'])->default('waiting');
            $table->string('winner')->nullable(); // 'X', 'O', or 'draw'
            $table->timestamp('last_move_at')->nullable();
            $table->timestamps();
            
            $table->index(['code']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
