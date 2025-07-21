<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Events\GameUpdated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Encoding\Encoding;

class GameController extends Controller
{
    public function createGame(Request $request): JsonResponse
    {
        $playerId = $request->input('player_id');
        
        // Generate a simple 6-character code without database check for now
        $code = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6));
        
        // Create a simple game object without database
        $game = (object) [
            'id' => rand(1000, 9999),
            'code' => $code,
            'player1_id' => $playerId,
            'status' => 'waiting',
            'created_at' => now()
        ];

        return response()->json([
            'success' => true,
            'game' => $game,
            'qr_url' => url("/join/{$game->code}")
        ]);
    }

    public function joinGame(Request $request, string $code): JsonResponse
    {
        $playerId = $request->input('player_id');
        $game = Game::where('code', $code)->first();

        if (!$game) {
            return response()->json(['success' => false, 'message' => 'Game not found'], 404);
        }

        if ($game->status !== 'waiting') {
            return response()->json(['success' => false, 'message' => 'Game is not available'], 400);
        }

        if ($game->player1_id === $playerId) {
            return response()->json(['success' => true, 'game' => $game, 'player' => 'X']);
        }

        $game->update([
            'player2_id' => $playerId,
            'status' => 'playing'
        ]);

        GameUpdated::dispatch($game);

        return response()->json(['success' => true, 'game' => $game, 'player' => 'O']);
    }

    public function makeMove(Request $request, string $code): JsonResponse
    {
        $playerId = $request->input('player_id');
        $grid = $request->input('grid');
        $position = $request->input('position');

        $game = Game::where('code', $code)->first();

        if (!$game || !$game->isPlayerInGame($playerId)) {
            return response()->json(['success' => false, 'message' => 'Game not found or unauthorized'], 404);
        }

        if ($game->status !== 'playing') {
            return response()->json(['success' => false, 'message' => 'Game is not active'], 400);
        }

        $gameState = $game->game_state;
        $playerSymbol = $game->getPlayerSymbol($playerId);

        if ($gameState['current_player'] !== $playerSymbol) {
            return response()->json(['success' => false, 'message' => 'Not your turn'], 400);
        }

        // Validate the move
        if (!$this->isValidMove($gameState, $grid, $position)) {
            return response()->json(['success' => false, 'message' => 'Invalid move'], 400);
        }

        // Make the move
        $gameState = $this->processMove($gameState, $grid, $position, $playerSymbol);

        $game->update([
            'game_state' => $gameState,
            'last_move_at' => now(),
            'status' => $gameState['game_over'] ? 'finished' : 'playing',
            'winner' => $gameState['winner']
        ]);

        GameUpdated::dispatch($game);

        return response()->json(['success' => true, 'game' => $game]);
    }

    public function getGame(string $code): JsonResponse
    {
        $game = Game::where('code', $code)->first();

        if (!$game) {
            return response()->json(['success' => false, 'message' => 'Game not found'], 404);
        }

        return response()->json(['success' => true, 'game' => $game]);
    }

    public function getQrCode(string $code)
    {
        $url = url("/join/{$code}");
        
        $qrCode = QrCode::create($url)
            ->setEncoding(new Encoding('UTF-8'))
            ->setSize(300)
            ->setMargin(10);

        $writer = new PngWriter();
        $result = $writer->write($qrCode);

        return response($result->getString())
            ->header('Content-Type', $result->getMimeType());
    }

    private function isValidMove(array $gameState, int $grid, int $position): bool
    {
        // Check if the position is empty
        if ($gameState['grids'][$grid][$position] !== null) {
            return false;
        }

        // Check if the grid is already won
        if ($gameState['grid_winners'][$grid] !== null) {
            return false;
        }

        // Check active grid restriction
        if ($gameState['active_grid'] !== null && $gameState['active_grid'] !== $grid) {
            return false;
        }

        return true;
    }

    private function processMove(array $gameState, int $grid, int $position, string $player): array
    {
        // Place the move
        $gameState['grids'][$grid][$position] = $player;

        // Check if this grid is won
        if ($this->checkGridWin($gameState['grids'][$grid], $player)) {
            $gameState['grid_winners'][$grid] = $player;
        }

        // Check if the overall game is won
        if ($this->checkOverallWin($gameState['grid_winners'], $player)) {
            $gameState['game_over'] = true;
            $gameState['winner'] = $player;
        } elseif ($this->isGameDraw($gameState)) {
            $gameState['game_over'] = true;
            $gameState['winner'] = 'draw';
        } else {
            // Set next active grid
            $gameState['active_grid'] = $gameState['grid_winners'][$position] === null ? $position : null;
            $gameState['current_player'] = $player === 'X' ? 'O' : 'X';
        }

        return $gameState;
    }

    private function checkGridWin(array $grid, string $player): bool
    {
        $winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        foreach ($winPatterns as $pattern) {
            if ($grid[$pattern[0]] === $player && 
                $grid[$pattern[1]] === $player && 
                $grid[$pattern[2]] === $player) {
                return true;
            }
        }

        return false;
    }

    private function checkOverallWin(array $gridWinners, string $player): bool
    {
        return $this->checkGridWin($gridWinners, $player);
    }

    private function isGameDraw(array $gameState): bool
    {
        foreach ($gameState['grids'] as $i => $grid) {
            if ($gameState['grid_winners'][$i] === null) {
                foreach ($grid as $cell) {
                    if ($cell === null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
