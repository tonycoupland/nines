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
        Schema::table('games', function (Blueprint $table) {
            // Game statistics (player1_id and player2_id already exist)
            $table->integer('move_count')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->string('end_reason')->nullable(); // 'win', 'draw', 'resign', 'abandon'
            $table->string('winner_symbol')->nullable(); // 'X', 'O', or null for draw
            
            $table->index('started_at');
            $table->index('ended_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['started_at']);
            $table->dropIndex(['ended_at']);
            
            $table->dropColumn([
                'move_count', 'started_at', 'ended_at', 'end_reason', 'winner_symbol'
            ]);
        });
    }
};
