// Enhanced Nines Game with URL routing, player persistence, resign, and stats
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Initialize Laravel Echo for websockets
window.Pusher = Pusher;
let echo = null;

// Player management and persistence
let playerId = null;
let playerStats = {
    games_played: 0,
    games_won: 0,
    games_lost: 0,
    games_abandoned: 0,
    total_time_played_seconds: 0,
    current_days_played_streak: 0,
    longest_days_played_streak: 0,
    current_unbeaten_streak: 0,
    longest_unbeaten_streak: 0,
    last_played_date: null
};

// Game state
let gameState = {
    grids: Array(9).fill(null).map(() => Array(9).fill('')),
    currentPlayer: 'X',
    activeGrid: null,
    gameWon: false,
    winner: null,
    gridWinners: Array(9).fill(null),
    isOnline: false,
    mySymbol: 'X',
    gameCode: null,
    gameStartTime: null
};

// Initialize player ID and load from cookie or generate new one
function initializePlayer() {
    playerId = getCookie('nines_player_id');
    if (!playerId) {
        playerId = generatePlayerId();
        setCookie('nines_player_id', playerId, 365);
    }
    console.log('Player ID:', playerId);
}

// Cookie management
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
}

// URL management for game resumption
function updateGameUrl(gameCode) {
    const newUrl = `${window.location.origin}/game/${gameCode}`;
    window.history.pushState({gameCode}, `Nines Game - ${gameCode}`, newUrl);
}

function clearGameUrl() {
    window.history.pushState({}, 'Nines Game', window.location.origin);
}

function checkUrlForGame() {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'game' && pathParts[2]) {
        const gameCode = pathParts[2].toUpperCase();
        if (gameCode.length === 4) {
            return gameCode;
        }
    }
    return null;
}

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
        
        // Connection event listeners
        echo.connector.pusher.connection.bind('connected', () => {
            console.log('WebSocket connection established');
            updateConnectionStatus(true);
        });
        
        echo.connector.pusher.connection.bind('error', (error) => {
            console.error('WebSocket connection error:', error);
            updateConnectionStatus(false);
        });
        
        echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('WebSocket connection lost');
            updateConnectionStatus(false);
        });
        
        echo.connector.pusher.connection.bind('unavailable', () => {
            console.error('WebSocket connection unavailable');
            updateConnectionStatus(false);
        });
        
    } catch (error) {
        console.error('Failed to load config, using defaults:', error);
        
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

// Connection status management
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = isConnected ? 'Connected' : 'Disconnected';
        statusElement.className = isConnected ? 'status-success' : 'status-error';
    }
}

// Stats management
async function loadPlayerStats() {
    try {
        const response = await fetch(`/api/player/stats?player_id=${playerId}`);
        
        if (!response.ok) {
            console.error('Player stats request failed with status:', response.status);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            playerStats = data.stats;
        } else {
            console.error('Player stats API returned error:', data.message);
        }
    } catch (error) {
        console.error('Failed to load player stats:', error);
    }
}

async function loadGlobalStats() {
    try {
        const response = await fetch('/api/stats/global');
        
        if (!response.ok) {
            console.error('Global stats request failed with status:', response.status);
            return null;
        }
        
        const data = await response.json();
        
        if (data.success) {
            return data.stats;
        } else {
            console.error('Global stats API returned error:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Failed to load global stats:', error);
        return null;
    }
}

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
    if (gameState.gameWon) return false;
    
    const cellValue = gameState.grids[gridIndex][cellIndex];
    if (cellValue !== '' && cellValue != null) return false;
    
    if (gameState.gridWinners[gridIndex] !== null) return false;
    
    if (gameState.activeGrid !== null && gameState.activeGrid !== gridIndex) return false;
    
    if (gameState.isOnline && gameState.currentPlayer !== gameState.mySymbol) return false;
    
    return true;
}

function makeMove(gridIndex, cellIndex) {
    if (!canMakeMove(gridIndex, cellIndex)) return false;
    
    gameState.grids[gridIndex][cellIndex] = gameState.currentPlayer;
    
    const gridWinner = checkGridWin(gridIndex);
    if (gridWinner) {
        gameState.gridWinners[gridIndex] = gridWinner;
    }
    
    const gameWinner = checkGameWin();
    if (gameWinner) {
        gameState.gameWon = true;
        gameState.winner = gameWinner;
        showMessage(`🎉 Player ${gameWinner} wins the game!`, 'success');
        endGame(gameWinner);
    }
    
    if (gameState.gridWinners[cellIndex] === null) {
        gameState.activeGrid = cellIndex;
    } else {
        gameState.activeGrid = null;
    }
    
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    
    updateDisplay();
    
    if (gameState.isOnline) {
        sendMove(gridIndex, cellIndex);
    }
    
    return true;
}

// Online game functions
async function createOnlineGame() {
    try {
        // Reset game state for new online game
        gameState = {
            grids: Array(9).fill(null).map(() => Array(9).fill('')),
            currentPlayer: 'X',
            activeGrid: null,
            gameWon: false,
            winner: null,
            gridWinners: Array(9).fill(null),
            isOnline: true,
            mySymbol: 'X',
            gameCode: null,
            gameStartTime: Date.now()
        };
        
        const response = await fetch('/api/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_id: playerId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            gameState.gameCode = data.game.code;
            gameState.mySymbol = data.game.player_symbol;
            
            // Debug logging for symbol assignment
            console.log('🎮 CREATED GAME - Your symbol:', gameState.mySymbol);
            console.log('🎮 Current player:', gameState.currentPlayer);
            
            updateGameUrl(gameState.gameCode);
            subscribeToGameUpdates(gameState.gameCode);
            
            showGameScreen();
            document.getElementById('game-code-display').textContent = `Game Code: ${gameState.gameCode}`;
            showMessage(`Game created! You are player ${gameState.mySymbol}. Share this code with your opponent.`, 'success');
            
            return data;
        } else {
            showMessage('Failed to create game', 'error');
        }
    } catch (error) {
        console.error('Error creating game:', error);
        showMessage('Error creating game', 'error');
    }
}

async function joinOnlineGame(code) {
    try {
        // Reset game state for joining new online game
        gameState = {
            grids: Array(9).fill(null).map(() => Array(9).fill('')),
            currentPlayer: 'X',
            activeGrid: null,
            gameWon: false,
            winner: null,
            gridWinners: Array(9).fill(null),
            isOnline: true,
            mySymbol: 'O',
            gameCode: null,
            gameStartTime: Date.now()
        };
        
        const response = await fetch(`/api/games/${code}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_id: playerId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            gameState.gameCode = data.game.code;
            gameState.mySymbol = data.game.player_symbol;
            
            // Debug logging for symbol assignment
            console.log('🎮 JOINED GAME - Your symbol:', gameState.mySymbol);
            console.log('🎮 Current player:', gameState.currentPlayer);
            
            if (data.game.game_state) {
                // Preserve critical player info when merging game state
                const mySymbol = gameState.mySymbol;
                const playerId = gameState.playerId;
                const isOnline = gameState.isOnline;
                const gameCode = gameState.gameCode;
                
                gameState = { ...gameState, ...data.game.game_state };
                
                // Restore preserved values
                gameState.mySymbol = mySymbol;
                gameState.playerId = playerId;
                gameState.isOnline = isOnline;
                gameState.gameCode = gameCode;
                
                console.log('🔧 Merged game state (join), preserved mySymbol:', gameState.mySymbol);
            }
            
            updateGameUrl(gameState.gameCode);
            subscribeToGameUpdates(gameState.gameCode);
            
            showGameScreen();
            document.getElementById('game-code-display').textContent = `Game Code: ${gameState.gameCode}`;
            showMessage(`${data.message} - You are player ${gameState.mySymbol}`, 'success');
            
            updateDisplay();
            return data;
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('Error joining game:', error);
        showMessage('Error joining game', 'error');
    }
}

async function resumeGame(code) {
    try {
        const response = await fetch(`/api/games/${code}?player_id=${playerId}`);
        const data = await response.json();
        
        if (data.success) {
            gameState.isOnline = true;
            gameState.gameCode = data.game.code;
            gameState.mySymbol = data.game.player_symbol;
            gameState.gameStartTime = Date.now();
            
            // Debug logging for symbol assignment
            console.log('🎮 RESUMED GAME - Your symbol:', gameState.mySymbol);
            console.log('🎮 Current player:', gameState.currentPlayer);
            
            if (data.game.game_state) {
                // Preserve critical player info when merging game state
                const mySymbol = gameState.mySymbol;
                const playerId = gameState.playerId;
                const isOnline = gameState.isOnline;
                const gameCode = gameState.gameCode;
                
                gameState = { ...gameState, ...data.game.game_state };
                
                // Restore preserved values
                gameState.mySymbol = mySymbol;
                gameState.playerId = playerId;
                gameState.isOnline = isOnline;
                gameState.gameCode = gameCode;
                
                console.log('🔧 Merged game state (resume), preserved mySymbol:', gameState.mySymbol);
            }
            
            subscribeToGameUpdates(gameState.gameCode);
            
            showGameScreen();
            document.getElementById('game-code-display').textContent = `Game Code: ${gameState.gameCode}`;
            showMessage(`Game resumed! You are player ${gameState.mySymbol}`, 'success');
            
            updateDisplay();
            return true;
        } else {
            showMessage('Failed to resume game: ' + data.message, 'error');
            clearGameUrl();
            return false;
        }
    } catch (error) {
        console.error('Error resuming game:', error);
        showMessage('Error resuming game', 'error');
        clearGameUrl();
        return false;
    }
}

async function resignGame() {
    if (!gameState.isOnline || !gameState.gameCode) {
        showMessage('No active online game to resign from', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to resign from this game?')) {
        try {
            const response = await fetch(`/api/games/${gameState.gameCode}/resign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_id: playerId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage('You have resigned from the game', 'info');
                endGame(gameState.mySymbol === 'X' ? 'O' : 'X', true);
            } else {
                showMessage('Failed to resign: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error resigning game:', error);
            showMessage('Error resigning game', 'error');
        }
    }
}

async function sendMove(gridIndex, cellIndex) {
    try {
        const response = await fetch(`/api/games/${gameState.gameCode}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_id: playerId,
                grid: gridIndex,
                position: cellIndex,
                game_state: gameState
            })
        });
        
        const data = await response.json();
        if (!data.success) {
            console.error('Failed to send move:', data.message);
        }
    } catch (error) {
        console.error('Error sending move:', error);
    }
}

function subscribeToGameUpdates(gameCode) {
    if (!echo) return;
    
    echo.channel(`game.${gameCode}`)
        .listen('GameUpdated', (e) => {
            console.log('Game update received:', e);
            
            if (e.type === 'move_made') {
                gameState = { ...gameState, ...e.gameState };
                updateDisplay();
                showMessage(`${e.data.player_id === playerId ? 'You' : 'Opponent'} made a move`, 'info');
            } else if (e.type === 'player_joined') {
                showMessage('Opponent joined the game!', 'success');
                gameState = { ...gameState, ...e.gameState };
                updateDisplay();
            } else if (e.type === 'player_resigned') {
                showMessage(`Player ${e.data.resigning_player} resigned. Player ${e.data.winner} wins!`, 'info');
                endGame(e.data.winner);
            }
        });
}

function endGame(winner, resigned = false) {
    gameState.gameWon = true;
    gameState.winner = winner;
    
    // Hide resign button when game ends
    document.getElementById('resign-btn').style.display = 'none';
    
    if (gameState.gameStartTime) {
        const gameDuration = (Date.now() - gameState.gameStartTime) / 1000;
        console.log(`Game ended. Duration: ${gameDuration} seconds`);
    }
    
    // Update local stats (will be synced with server)
    if (gameState.isOnline) {
        loadPlayerStats(); // Refresh stats from server
    }
    
    updateDisplay();
}

// UI Management
function showMenu() {
    document.getElementById('menu-screen').style.display = 'block';
    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('stats-screen').style.display = 'none';
    
    // Hide game info when returning to menu
    const gameInfo = document.getElementById('game-info');
    if (gameInfo) {
        gameInfo.classList.remove('visible');
    }
    
    clearGameUrl();
}

function showCreateGame() {
    createOnlineGame();
}

function showJoinGame() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('join-screen').style.display = 'block';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('stats-screen').style.display = 'none';
    document.getElementById('game-code-input').focus();
}

function showGameScreen() {
    console.log('showGameScreen called, gameState:', { 
        isOnline: gameState.isOnline, 
        currentPlayer: gameState.currentPlayer 
    });
    
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('stats-screen').style.display = 'none';
    
    // Show game info section
    const gameInfo = document.getElementById('game-info');
    if (gameInfo) {
        gameInfo.classList.add('visible');
        console.log('Added visible class to game-info, classList:', gameInfo.classList.toString());
    } else {
        console.error('game-info element not found!');
    }
    
    // Show/hide connection status based on game type
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
        if (gameState.isOnline) {
            connectionStatus.style.display = 'block';
        } else {
            connectionStatus.style.display = 'none';
        }
    }
    
    // Show resign button for online games
    const resignBtn = document.getElementById('resign-btn');
    if (gameState.isOnline && !gameState.gameWon) {
        resignBtn.style.display = 'inline-block';
    } else {
        resignBtn.style.display = 'none';
    }
    
    generateBoard();
    updateDisplay();
}

async function showStatsScreen() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('stats-screen').style.display = 'block';
    
    await loadPlayerStats();
    const globalStats = await loadGlobalStats();
    displayStats(globalStats);
}

function displayStats(globalStats) {
    const statsContainer = document.getElementById('stats-content');
    
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };
    
    statsContainer.innerHTML = `
        <h3>📊 Your Stats</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${playerStats.games_played}</div>
                <div class="stat-label">Games Played</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${playerStats.games_won}</div>
                <div class="stat-label">Games Won</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${playerStats.games_lost}</div>
                <div class="stat-label">Games Lost</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${playerStats.games_abandoned}</div>
                <div class="stat-label">Games Abandoned</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatTime(playerStats.total_time_played_seconds)}</div>
                <div class="stat-label">Time Played</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${playerStats.current_days_played_streak}</div>
                <div class="stat-label">Current Daily Streak</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${playerStats.longest_days_played_streak}</div>
                <div class="stat-label">Longest Daily Streak</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${playerStats.current_unbeaten_streak}</div>
                <div class="stat-label">Current Unbeaten Streak</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${playerStats.longest_unbeaten_streak}</div>
                <div class="stat-label">Longest Unbeaten Streak</div>
            </div>
        </div>
        
        ${globalStats ? `
        <h3>🌍 Global Stats</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${globalStats.total_games}</div>
                <div class="stat-label">Total Games</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${globalStats.active_games}</div>
                <div class="stat-label">Active Games</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${globalStats.total_players}</div>
                <div class="stat-label">Total Players</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatTime(globalStats.avg_game_duration_seconds)}</div>
                <div class="stat-label">Avg Game Duration</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${globalStats.avg_moves_per_game}</div>
                <div class="stat-label">Avg Moves per Game</div>
            </div>
        </div>
        ` : ''}
    `;
}

function joinGame() {
    const code = document.getElementById('game-code-input').value.trim().toUpperCase();
    if (code.length === 4) {
        joinOnlineGame(code);
    } else {
        showMessage('Please enter a valid 4-letter game code', 'error');
    }
}

function startLocalGame() {
    gameState = {
        grids: Array(9).fill(null).map(() => Array(9).fill('')),
        currentPlayer: 'X',
        activeGrid: null,
        gameWon: false,
        winner: null,
        gridWinners: Array(9).fill(null),
        isOnline: false,
        mySymbol: 'X',
        gameCode: null,
        gameStartTime: Date.now()
    };
    
    showGameScreen();
    document.getElementById('game-code-display').textContent = 'Local Game';
    
    // Hide connection status for local games
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
        connectionStatus.style.display = 'none';
    }
}

function newGame() {
    if (gameState.isOnline) {
        if (confirm('This will end the current online game. Are you sure?')) {
            if (gameState.gameCode && !gameState.gameWon) {
                resignGame();
            }
            showMenu();
        }
    } else {
        startLocalGame();
    }
}

function generateBoard() {
    const megaGrid = document.getElementById('mega-grid');
    megaGrid.innerHTML = '';
    
    for (let gridIndex = 0; gridIndex < 9; gridIndex++) {
        const gridDiv = document.createElement('div');
        gridDiv.className = 'grid';
        gridDiv.id = `grid-${gridIndex}`;
        
        const gridHeader = document.createElement('div');
        gridHeader.className = 'grid-header';
        gridHeader.textContent = `Grid ${gridIndex + 1}`;
        gridDiv.appendChild(gridHeader);
        
        const miniGrid = document.createElement('div');
        miniGrid.className = 'mini-grid';
        
        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${gridIndex}-${cellIndex}`;
            
            cell.onclick = () => {
                console.log(`Clicked cell ${gridIndex}-${cellIndex}, current player: ${gameState.currentPlayer}, my symbol: ${gameState.mySymbol}`);
                if (canMakeMove(gridIndex, cellIndex)) {
                    makeMove(gridIndex, cellIndex);
                } else {
                    const cellValue = gameState.grids[gridIndex][cellIndex];
                    console.log('Move not allowed:', {
                        gameWon: gameState.gameWon,
                        cellValue: cellValue,
                        cellOccupied: cellValue && cellValue !== '',
                        gridWon: gameState.gridWinners[gridIndex] !== null,
                        activeGrid: gameState.activeGrid,
                        requiredGrid: gameState.activeGrid,
                        isMyTurn: gameState.currentPlayer === gameState.mySymbol,
                        currentPlayer: gameState.currentPlayer,
                        mySymbol: gameState.mySymbol
                    });
                }
            };
            
            miniGrid.appendChild(cell);
        }
        
        gridDiv.appendChild(miniGrid);
        megaGrid.appendChild(gridDiv);
    }
}

function updateDisplay() {
    // Update cells with current game state
    for (let gridIndex = 0; gridIndex < 9; gridIndex++) {
        const gridDiv = document.getElementById(`grid-${gridIndex}`);
        
        // Update grid winner display
        const existingWinnerOverlay = gridDiv.querySelector('.grid-winner');
        if (gameState.gridWinners[gridIndex]) {
            gridDiv.classList.add('won');
            gridDiv.classList.add(`won-${gameState.gridWinners[gridIndex].toLowerCase()}`);
            
            // Add winner overlay if not already present
            if (!existingWinnerOverlay) {
                const winnerOverlay = document.createElement('div');
                winnerOverlay.className = 'grid-winner';
                winnerOverlay.textContent = gameState.gridWinners[gridIndex];
                winnerOverlay.style.color = gameState.gridWinners[gridIndex] === 'X' ? '#e74c3c' : '#3498db';
                gridDiv.appendChild(winnerOverlay);
            }
        } else {
            gridDiv.classList.remove('won', 'won-x', 'won-o');
            if (existingWinnerOverlay) {
                existingWinnerOverlay.remove();
            }
        }
        
        // Update active grid highlighting
        if (gameState.activeGrid === gridIndex || gameState.activeGrid === null) {
            gridDiv.classList.remove('disabled');
        } else {
            gridDiv.classList.add('disabled');
        }
        
        // Update individual cells
        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            const cell = document.getElementById(`cell-${gridIndex}-${cellIndex}`);
            const cellValue = gameState.grids[gridIndex][cellIndex];
            
            cell.textContent = cellValue;
            cell.classList.remove('occupied', 'occupied-x', 'occupied-o', 'clickable', 'waiting');
            
            if (cellValue) {
                cell.classList.add('occupied', `occupied-${cellValue.toLowerCase()}`);
            } else if (canMakeMove(gridIndex, cellIndex)) {
                cell.classList.add('clickable');
            } else {
                cell.classList.add('waiting');
            }
        }
    }
    
    // Update current player display
    const currentPlayerDisplay = document.getElementById('current-player-display');
    if (gameState.gameWon) {
        currentPlayerDisplay.textContent = `🎉 Player ${gameState.winner} wins!`;
    } else if (gameState.isOnline) {
        const isMyTurn = gameState.currentPlayer === gameState.mySymbol;
        // Debug logging to help identify issues
        console.log('🔄 Display update - My symbol:', gameState.mySymbol, 'Current player:', gameState.currentPlayer, 'Is my turn:', isMyTurn);
        currentPlayerDisplay.textContent = isMyTurn ? 
            `Your turn (${gameState.mySymbol})` : 
            `Opponent's turn (${gameState.currentPlayer})`;
    } else {
        currentPlayerDisplay.textContent = `Player ${gameState.currentPlayer}'s turn`;
    }
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = message;
    messageDiv.className = `status-message status-${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// Initialize the application
async function initializeApp() {
    await initializeEcho();
    initializePlayer();
    await loadPlayerStats();
    
    // Debug: Check if elements exist
    console.log('DOM elements check:', {
        gameInfo: !!document.getElementById('game-info'),
        currentPlayerDisplay: !!document.getElementById('current-player-display'),
        gameScreen: !!document.getElementById('game-screen')
    });
    
    // Check if there's a game code in the URL
    const urlGameCode = checkUrlForGame();
    if (urlGameCode) {
        const resumed = await resumeGame(urlGameCode);
        if (!resumed) {
            showMenu();
        }
    } else {
        showMenu();
    }
    
    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.gameCode) {
            resumeGame(event.state.gameCode);
        } else {
            showMenu();
        }
    });
}

// Global functions for HTML onclick handlers
window.startLocalGame = startLocalGame;
window.showCreateGame = showCreateGame;
window.showJoinGame = showJoinGame;
window.showStatsScreen = showStatsScreen;
window.showMenu = showMenu;
window.joinGame = joinGame;
window.newGame = newGame;
window.resignGame = resignGame;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);