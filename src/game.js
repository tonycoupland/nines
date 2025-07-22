// Pure JavaScript Nines Game with Laravel Echo integration
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Initialize Laravel Echo for websockets
window.Pusher = Pusher;
let echo = null;

// Initialize Echo with config from server
async function initializeEcho() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        const reverbConfig = config.reverb;
        
        echo = new Echo({
            broadcaster: 'reverb',
            key: reverbConfig.key,
            wsHost: reverbConfig.host,
            wsPort: reverbConfig.scheme === 'https' ? 443 : reverbConfig.port,
            wssPort: reverbConfig.scheme === 'https' ? 443 : reverbConfig.port,
            forceTLS: reverbConfig.scheme === 'https',
            enabledTransports: ['ws', 'wss'],
        });
        
        console.log('Echo initialized with config:', reverbConfig);
        
        // Add connection event listeners for debugging
        echo.connector.pusher.connection.bind('connected', () => {
            console.log('WebSocket connection established');
            console.log('Connection state:', echo.connector.pusher.connection.state);
        });
        
        echo.connector.pusher.connection.bind('error', (error) => {
            console.error('WebSocket connection error:', error);
        });
        
        echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('WebSocket connection lost');
        });
        
        echo.connector.pusher.connection.bind('unavailable', () => {
            console.error('WebSocket connection unavailable');
        });
        
        echo.connector.pusher.connection.bind('failed', () => {
            console.error('WebSocket connection failed');
        });
    } catch (error) {
        console.error('Failed to load config, using defaults:', error);
        
        // Fallback to hardcoded config
        echo = new Echo({
            broadcaster: 'reverb',
            key: 'local-key',
            wsHost: window.location.hostname,
            wsPort: 8081,
            wssPort: 8081,
            forceTLS: false,
            enabledTransports: ['ws', 'wss'],
        });
    }
}

// Initialize Echo when the page loads
initializeEcho();

// Game state
let gameState = {
    grids: Array(9).fill(null).map(() => Array(9).fill('')),
    currentPlayer: 'X',
    activeGrid: null,
    gameWon: false,
    winner: null,
    gridWinners: Array(9).fill(null),
    isOnline: false,
    gameCode: null,
    playerId: 'player_' + Math.random().toString(36).substr(2, 9),
    mySymbol: null,
    channel: null
};

// Game logic functions
function checkGridWin(gridIndex) {
    const grid = gameState.grids[gridIndex];
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (grid[a] && grid[a] === grid[b] && grid[b] === grid[c]) {
            return grid[a];
        }
    }
    return null;
}

function checkGameWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (gameState.gridWinners[a] && 
            gameState.gridWinners[a] === gameState.gridWinners[b] && 
            gameState.gridWinners[b] === gameState.gridWinners[c]) {
            return gameState.gridWinners[a];
        }
    }
    return null;
}

function canMakeMove(gridIndex, cellIndex) {
    // Check if game is over
    if (gameState.gameWon) return false;
    
    // Check if cell is already occupied
    if (gameState.grids[gridIndex][cellIndex] !== '') return false;
    
    // Check if grid is already won
    if (gameState.gridWinners[gridIndex] !== null) return false;
    
    // Check if we're restricted to a specific grid
    if (gameState.activeGrid !== null && gameState.activeGrid !== gridIndex) return false;
    
    // Check if it's our turn in online games
    if (gameState.isOnline && gameState.currentPlayer !== gameState.mySymbol) return false;
    
    return true;
}

function makeMove(gridIndex, cellIndex) {
    // Check if move is valid using the canMakeMove function
    if (!canMakeMove(gridIndex, cellIndex)) return false;
    
    // Make the move
    gameState.grids[gridIndex][cellIndex] = gameState.currentPlayer;
    
    // Check if grid is won
    const gridWinner = checkGridWin(gridIndex);
    if (gridWinner) {
        gameState.gridWinners[gridIndex] = gridWinner;
    }
    
    // Check if game is won
    const gameWinner = checkGameWin();
    if (gameWinner) {
        gameState.gameWon = true;
        gameState.winner = gameWinner;
        showMessage(`🎉 Player ${gameWinner} wins the game!`, 'success');
    }
    
    // Set next active grid
    if (gameState.gridWinners[cellIndex] === null) {
        gameState.activeGrid = cellIndex;
    } else {
        gameState.activeGrid = null; // Can play anywhere
    }
    
    // Switch players
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    
    // Send move to server if online
    if (gameState.isOnline) {
        sendMoveToServer(gridIndex, cellIndex);
    }
    
    updateDisplay();
    return true;
}

function sendMoveToServer(gridIndex, cellIndex) {
    if (!gameState.gameCode) return;
    
    fetch('/api/games/' + gameState.gameCode + '/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            grid: gridIndex,
            position: cellIndex,
            player_id: gameState.playerId,
            game_state: {
                grids: gameState.grids,
                currentPlayer: gameState.currentPlayer,
                activeGrid: gameState.activeGrid,
                gridWinners: gameState.gridWinners,
                gameWon: gameState.gameWon,
                winner: gameState.winner
            }
        })
    }).catch(error => {
        console.error('Error sending move:', error);
        showMessage('Failed to send move to server', 'error');
    });
}

function updateDisplay() {
    // Update current player display
    const currentPlayerDisplay = document.getElementById('current-player-display');
    if (gameState.gameWon) {
        currentPlayerDisplay.textContent = `🎉 Player ${gameState.winner} Wins!`;
    } else {
        const symbol = gameState.currentPlayer === 'X' ? '❌' : '⭕';
        if (gameState.isOnline) {
            const isMyTurn = gameState.currentPlayer === gameState.mySymbol;
            currentPlayerDisplay.textContent = isMyTurn 
                ? `${symbol} Your turn (${gameState.mySymbol})` 
                : `${symbol} Opponent's turn (${gameState.currentPlayer})`;
        } else {
            currentPlayerDisplay.textContent = `${symbol} Player ${gameState.currentPlayer}'s turn`;
        }
    }
    
    // Update game board
    const megaGrid = document.getElementById('mega-grid');
    megaGrid.innerHTML = '';
    
    for (let gridIndex = 0; gridIndex < 9; gridIndex++) {
        const gridElement = document.createElement('div');
        gridElement.className = 'grid';
        
        // Add active/disabled classes based on game state and turn
        const isMyTurn = !gameState.isOnline || gameState.currentPlayer === gameState.mySymbol;
        const canPlayInThisGrid = (gameState.activeGrid === null || gameState.activeGrid === gridIndex);
        const gridNotWon = !gameState.gridWinners[gridIndex];
        const gameNotOver = !gameState.gameWon;
        
        if (isMyTurn && canPlayInThisGrid && gridNotWon && gameNotOver) {
            gridElement.classList.add('active');
        } else {
            gridElement.classList.add('disabled');
        }
        
        // Grid header
        const gridHeader = document.createElement('div');
        gridHeader.className = 'grid-header';
        gridHeader.textContent = `Grid ${gridIndex + 1}`;
        gridElement.appendChild(gridHeader);
        
        // Mini grid
        const miniGrid = document.createElement('div');
        miniGrid.className = 'mini-grid';
        
        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            const cellValue = gameState.grids[gridIndex][cellIndex];
            if (cellValue) {
                cell.textContent = cellValue === 'X' ? '❌' : '⭕';
                cell.classList.add('occupied');
                cell.classList.add(cellValue.toLowerCase());
            } else {
                cell.textContent = cellIndex + 1;
                // Only allow clicks if it's the player's turn
                const isMyTurn = !gameState.isOnline || gameState.currentPlayer === gameState.mySymbol;
                if (isMyTurn) {
                    cell.onclick = () => makeMove(gridIndex, cellIndex);
                    cell.classList.add('clickable');
                } else {
                    cell.classList.add('waiting');
                }
                
                // Add playable class if this cell can be played
                if (canMakeMove(gridIndex, cellIndex)) {
                    cell.classList.add('playable');
                }
            }
            
            miniGrid.appendChild(cell);
        }
        
        gridElement.appendChild(miniGrid);
        
        // Add grid winner overlay
        if (gameState.gridWinners[gridIndex]) {
            const winnerOverlay = document.createElement('div');
            winnerOverlay.className = 'grid-winner';
            winnerOverlay.textContent = gameState.gridWinners[gridIndex] === 'X' ? '❌' : '⭕';
            gridElement.appendChild(winnerOverlay);
        }
        
        megaGrid.appendChild(gridElement);
    }
}

function showMessage(message, type = 'info') {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

// Screen management
function showScreen(screenId) {
    const screens = ['menu-screen', 'join-screen', 'game-screen'];
    screens.forEach(screen => {
        const element = document.getElementById(screen);
        if (screen === screenId) {
            element.classList.add('visible');
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
            element.classList.remove('visible');
        }
    });
}

// Game mode functions
window.startLocalGame = function() {
    gameState.isOnline = false;
    gameState.gameCode = null;
    gameState.mySymbol = null;
    resetGame();
    document.getElementById('game-info').classList.add('visible');
    document.getElementById('game-code-display').style.display = 'none';
    document.getElementById('connection-status').style.display = 'none';
    showScreen('game-screen');
};

window.showCreateGame = async function() {
    try {
        showMessage('Creating game...', 'info');
        
        const response = await fetch('/api/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                player_id: gameState.playerId
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create game');
        }
        
        const data = await response.json();
        gameState.gameCode = data.game.code;
        gameState.isOnline = true;
        gameState.mySymbol = 'X'; // Creator is always X
        
        setupOnlineGame();
        showMessage(`Game created! Code: ${gameState.gameCode}`, 'success');
        
    } catch (error) {
        console.error('Error creating game:', error);
        showMessage('Failed to create game', 'error');
    }
};

window.showJoinGame = function() {
    showScreen('join-screen');
};

window.joinGame = async function() {
    const codeInput = document.getElementById('game-code-input');
    const gameCode = codeInput.value.trim().toUpperCase();
    
    if (!gameCode || gameCode.length !== 4) {
        showMessage('Please enter a valid 4-letter game code', 'error');
        return;
    }
    
    try {
        showMessage('Joining game...', 'info');
        
        const response = await fetch(`/api/games/${gameCode}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                player_id: gameState.playerId
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to join game');
        }
        
        const data = await response.json();
        gameState.gameCode = gameCode;
        gameState.isOnline = true;
        gameState.mySymbol = 'O'; // Joiner is always O
        gameState.currentPlayer = 'X'; // Game always starts with X
        
        // Force reset to ensure clean state
        resetGame();
        
        setupOnlineGame();
        showMessage('Joined game successfully! Waiting for player X to start...', 'success');
        
    } catch (error) {
        console.error('Error joining game:', error);
        showMessage('Failed to join game. Check the code and try again.', 'error');
    }
};

async function setupOnlineGame() {
    // Setup game display
    document.getElementById('game-info').classList.add('visible');
    document.getElementById('game-code-display').textContent = `Game Code: ${gameState.gameCode}`;
    document.getElementById('game-code-display').style.display = 'block';
    document.getElementById('connection-status').style.display = 'block';
    document.getElementById('connection-status').textContent = 'Connecting...';
    
    // Ensure Echo is initialized
    if (!echo) {
        await initializeEcho();
    }
    
    // Setup WebSocket channel
    if (gameState.channel) {
        echo.leave(`game.${gameState.gameCode}`);
    }
    
    gameState.channel = echo.channel(`game.${gameState.gameCode}`)
        .listen('.game-updated', (data) => {
            console.log('Raw WebSocket data received:', data);
            handleGameUpdate(data);
        })
        .error((error) => {
            console.error('Channel error:', error);
        });
        
    // Test connection
    gameState.channel.subscribed(() => {
        console.log(`Successfully subscribed to channel: game.${gameState.gameCode}`);
    });
    
    document.getElementById('connection-status').textContent = 'Connected';
    showScreen('game-screen');
    
    // Force display update to show correct turn state
    updateDisplay();
    
    // Log for debugging
    console.log(`Set up WebSocket for game: ${gameState.gameCode}, My symbol: ${gameState.mySymbol}, Current player: ${gameState.currentPlayer}`);
}

function handleGameUpdate(data) {
    console.log('Game update received:', data);
    
    // Update game state from server
    if (data.game && data.game.game_state) {
        const serverState = data.game.game_state;
        gameState.grids = serverState.grids || gameState.grids;
        gameState.currentPlayer = serverState.currentPlayer || gameState.currentPlayer;
        gameState.activeGrid = serverState.activeGrid;
        gameState.gridWinners = serverState.gridWinners || gameState.gridWinners;
        gameState.gameWon = serverState.gameWon || false;
        gameState.winner = serverState.winner;
        
        updateDisplay();
        
        if (gameState.gameWon) {
            showMessage(`🎉 Player ${gameState.winner} wins the game!`, 'success');
        }
    }
}

window.newGame = function() {
    resetGame();
    updateDisplay();
};

function resetGame() {
    gameState.grids = Array(9).fill(null).map(() => Array(9).fill(''));
    gameState.currentPlayer = 'X';
    gameState.activeGrid = null;
    gameState.gameWon = false;
    gameState.winner = null;
    gameState.gridWinners = Array(9).fill(null);
}

window.showMenu = function() {
    if (gameState.channel) {
        echo.leave(`game.${gameState.gameCode}`);
        gameState.channel = null;
    }
    
    gameState.isOnline = false;
    gameState.gameCode = null;
    gameState.mySymbol = null;
    
    showScreen('menu-screen');
};

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    showScreen('menu-screen');
    updateDisplay();
});