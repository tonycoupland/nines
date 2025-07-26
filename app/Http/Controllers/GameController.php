<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Player;
use App\Models\PlayerStats;
use App\Events\GameUpdated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Carbon\Carbon;

class GameController extends Controller
{
    public function createGame(Request $request): JsonResponse
    {
        $playerId = $request->input('player_id');
        
        // Create or find player record
        $player = Player::findOrCreateByPlayerId($playerId);
        
        // Generate 4-character game code
        $code = Game::generateCode();
        
        // Create game with proper tracking
        $game = Game::create([
            'code' => $code,
            'player1_id' => $player->id,
            'game_state' => [
                'grids' => array_fill(0, 9, array_fill(0, 9, '')),
                'grid_winners' => array_fill(0, 9, null),
                'current_player' => 'X',
                'active_grid' => null,
                'game_over' => false,
                'winner' => null
            ],
            'status' => 'waiting',
            'started_at' => now(),
            'move_count' => 0
        ]);

        return response()->json([
            'success' => true,
            'game' => [
                'id' => $game->id,
                'code' => $game->code,
                'status' => $game->status,
                'game_state' => $game->game_state,
                'player_symbol' => 'X'
            ],
            'qr_url' => url("/game/{$game->code}")
        ]);
    }

    public function joinGame(Request $request, string $code): JsonResponse
    {
        $playerId = $request->input('player_id');
        
        // Create or find player record
        $player = Player::findOrCreateByPlayerId($playerId);
        
        // Find game by code
        $game = Game::where('code', strtoupper($code))->first();
        
        if (!$game) {
            return response()->json([
                'success' => false,
                'message' => 'Game not found'
            ], 404);
        }
        
        if ($game->status !== 'waiting') {
            // Check if this player is already in the game
            if ($game->player1_id === $player->id || $game->player2_id === $player->id) {
                return response()->json([
                    'success' => true,
                    'game' => [
                        'id' => $game->id,
                        'code' => $game->code,
                        'status' => $game->status,
                        'game_state' => $game->game_state,
                        'player_symbol' => $game->player1_id === $player->id ? 'X' : 'O'
                    ],
                    'message' => 'Rejoined existing game'
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Game is full or already ended'
            ], 400);
        }
        
        // Join game as player 2
        $game->update([
            'player2_id' => $player->id,
            'status' => 'active'
        ]);
        
        // Broadcast game update
        broadcast(new GameUpdated($game->code, $game->game_state, 'player_joined'));

        return response()->json([
            'success' => true,
            'game' => [
                'id' => $game->id,
                'code' => $game->code,
                'status' => $game->status,
                'game_state' => $game->game_state,
                'player_symbol' => 'O'
            ],
            'message' => 'Successfully joined game'
        ]);
    }

    public function getGame(Request $request, string $code): JsonResponse
    {
        $playerId = $request->input('player_id');
        
        $game = Game::where('code', strtoupper($code))->first();
        
        if (!$game) {
            return response()->json([
                'success' => false,
                'message' => 'Game not found'
            ], 404);
        }
        
        // Create or find player record (same as in create/join)
        $player = Player::findOrCreateByPlayerId($playerId);
        
        // Check if player is in this game
        if ($game->player1_id !== $player->id && $game->player2_id !== $player->id) {
            return response()->json([
                'success' => false,
                'message' => 'Player not in this game'
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'game' => [
                'id' => $game->id,
                'code' => $game->code,
                'status' => $game->status,
                'game_state' => $game->game_state,
                'player_symbol' => $game->player1_id === $player->id ? 'X' : 'O'
            ]
        ]);
    }

    public function makeMove(Request $request, string $code): JsonResponse
    {
        $playerId = $request->input('player_id');
        $grid = $request->input('grid');
        $position = $request->input('position');
        $gameState = $request->input('game_state');

        // Find game and player
        $game = Game::where('code', strtoupper($code))->first();
        $player = Player::where('player_id', $playerId)->first();
        
        if (!$game || !$player) {
            return response()->json(['success' => false, 'message' => 'Game or player not found'], 404);
        }
        
        // Verify player is in game
        if ($game->player1_id !== $player->id && $game->player2_id !== $player->id) {
            return response()->json(['success' => false, 'message' => 'Player not in game'], 403);
        }
        
        // Update game state and move count
        $game->update([
            'game_state' => $gameState,
            'move_count' => $game->move_count + 1,
            'last_move_at' => now()
        ]);
        
        // Check for game end and update stats if needed
        if ($gameState['game_over']) {
            $this->endGame($game, $gameState['winner']);
        }
        
        // Broadcast move
        broadcast(new GameUpdated($game->code, $gameState, 'move_made', [
            'grid' => $grid,
            'position' => $position,
            'player_id' => $playerId
        ]));

        return response()->json([
            'success' => true,
            'game_state' => $gameState
        ]);
    }

    public function resignGame(Request $request, string $code): JsonResponse
    {
        $playerId = $request->input('player_id');
        
        $game = Game::where('code', strtoupper($code))->first();
        $player = Player::where('player_id', $playerId)->first();
        
        if (!$game || !$player) {
            return response()->json(['success' => false, 'message' => 'Game or player not found'], 404);
        }
        
        // Verify player is in game
        if ($game->player1_id !== $player->id && $game->player2_id !== $player->id) {
            return response()->json(['success' => false, 'message' => 'Player not in game'], 403);
        }
        
        // Determine winner (opponent)
        $resigningPlayerSymbol = $game->player1_id === $player->id ? 'X' : 'O';
        $winnerSymbol = $resigningPlayerSymbol === 'X' ? 'O' : 'X';
        
        // End game due to resignation
        $this->endGame($game, $winnerSymbol, 'resign');
        
        // Broadcast resignation
        broadcast(new GameUpdated($game->code, $game->game_state, 'player_resigned', [
            'resigning_player' => $resigningPlayerSymbol,
            'winner' => $winnerSymbol
        ]));
        
        return response()->json([
            'success' => true,
            'message' => 'Game resigned successfully'
        ]);
    }

    public function getPlayerStats(Request $request): JsonResponse
    {
        $playerId = $request->input('player_id');
        
        // Auto-create player if it doesn't exist
        $player = Player::findOrCreateByPlayerId($playerId);
        
        // Load stats relationship
        $player->load('stats');
        $stats = $player->stats;
        
        return response()->json([
            'success' => true,
            'stats' => [
                'games_played' => $stats->games_played ?? 0,
                'games_won' => $stats->games_won ?? 0,
                'games_lost' => $stats->games_lost ?? 0,
                'games_abandoned' => $stats->games_abandoned ?? 0,
                'total_time_played_seconds' => $stats->total_time_played_seconds ?? 0,
                'current_days_played_streak' => $stats->current_days_played_streak ?? 0,
                'longest_days_played_streak' => $stats->longest_days_played_streak ?? 0,
                'current_unbeaten_streak' => $stats->current_unbeaten_streak ?? 0,
                'longest_unbeaten_streak' => $stats->longest_unbeaten_streak ?? 0,
                'last_played_date' => $stats->last_played_date?->format('Y-m-d')
            ]
        ]);
    }

    public function getGlobalStats(): JsonResponse
    {
        $totalGames = Game::count();
        $activeGames = Game::where('status', 'active')->count();
        $completedGames = Game::where('status', 'completed')->count();
        $totalPlayers = Player::count();
        
        // Get database driver to use appropriate SQL syntax
        $driver = config('database.default');
        $connection = config("database.connections.{$driver}.driver");
        
        if ($connection === 'pgsql') {
            // PostgreSQL syntax
            $avgGameDuration = Game::whereNotNull('ended_at')
                ->whereNotNull('started_at')
                ->selectRaw('AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_duration')
                ->value('avg_duration');
        } else {
            // MySQL/MariaDB syntax
            $avgGameDuration = Game::whereNotNull('ended_at')
                ->whereNotNull('started_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as avg_duration')
                ->value('avg_duration');
        }
        
        $avgMovesPerGame = Game::where('move_count', '>', 0)->avg('move_count');
        
        return response()->json([
            'success' => true,
            'stats' => [
                'total_games' => $totalGames,
                'active_games' => $activeGames,
                'completed_games' => $completedGames,
                'total_players' => $totalPlayers,
                'avg_game_duration_seconds' => round($avgGameDuration ?? 0),
                'avg_moves_per_game' => round($avgMovesPerGame ?? 0, 1)
            ]
        ]);
    }

    private function endGame(Game $game, ?string $winnerSymbol, string $endReason = 'win'): void
    {
        // Update game record
        $game->update([
            'status' => 'completed',
            'winner_symbol' => $winnerSymbol,
            'end_reason' => $endReason,
            'ended_at' => now()
        ]);
        
        // Calculate game duration
        $durationSeconds = $game->started_at && $game->ended_at 
            ? $game->started_at->diffInSeconds($game->ended_at)
            : 0;
        
        // Update player stats
        $player1 = Player::find($game->player1_id);
        $player2 = Player::find($game->player2_id);
        
        if ($player1 && $player1->stats) {
            $result = $this->getPlayerResult($winnerSymbol, 'X', $endReason);
            $player1->stats->recordGameResult($result, $durationSeconds);
        }
        
        if ($player2 && $player2->stats) {
            $result = $this->getPlayerResult($winnerSymbol, 'O', $endReason);
            $player2->stats->recordGameResult($result, $durationSeconds);
        }
    }
    
    private function getPlayerResult(?string $winnerSymbol, string $playerSymbol, string $endReason): string
    {
        if ($endReason === 'resign' || $endReason === 'abandon') {
            return $winnerSymbol === $playerSymbol ? 'win' : 'abandon';
        }
        
        if ($winnerSymbol === null) {
            return 'draw';
        }
        
        return $winnerSymbol === $playerSymbol ? 'win' : 'loss';
    }
}