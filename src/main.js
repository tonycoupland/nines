import 'phaser';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRID_SIZE = 3;
const TOTAL_GRIDS = 9;
const CELL_SIZE = 50;
const GRID_PADDING = 8;

// Initialize Laravel Echo for websockets
window.Pusher = Pusher;
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: 'local',
    wsHost: window.location.hostname,
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
});

// Generate unique player ID for this session
const PLAYER_ID = 'player_' + Math.random().toString(36).substr(2, 9);

// Menu Scene for game mode selection
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');
        
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;

        // Title
        this.add.text(centerX, 100, '🎮 NINES 🎮', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ecf0f1',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 150, 'The Ultimate 9-Grid Strategy Game', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#bdc3c7'
        }).setOrigin(0.5);

        // Menu buttons
        const buttonStyle = {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#2c3e50',
            backgroundColor: '#ecf0f1',
            padding: { x: 30, y: 15 },
            align: 'center'
        };

        // Local Game button
        const localBtn = this.add.text(centerX, centerY - 50, '🏠 Play Locally', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.startLocalGame())
            .on('pointerover', () => localBtn.setStyle({ backgroundColor: '#3498db', color: '#fff' }))
            .on('pointerout', () => localBtn.setStyle({ backgroundColor: '#ecf0f1', color: '#2c3e50' }));

        // Create Remote Game button
        const createBtn = this.add.text(centerX, centerY + 20, '🌐 Create Remote Game', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.createRemoteGame())
            .on('pointerover', () => createBtn.setStyle({ backgroundColor: '#27ae60', color: '#fff' }))
            .on('pointerout', () => createBtn.setStyle({ backgroundColor: '#ecf0f1', color: '#2c3e50' }));

        // Join Remote Game button
        const joinBtn = this.add.text(centerX, centerY + 90, '🔗 Join Remote Game', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showJoinInput())
            .on('pointerover', () => joinBtn.setStyle({ backgroundColor: '#e74c3c', color: '#fff' }))
            .on('pointerout', () => joinBtn.setStyle({ backgroundColor: '#ecf0f1', color: '#2c3e50' }));

        // Check if we need to auto-join from URL
        this.checkAutoJoin();
    }

    startLocalGame() {
        this.scene.start('GameScene', { mode: 'local' });
    }

    async createRemoteGame() {
        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: PLAYER_ID })
            });
            
            const data = await response.json();
            if (data.success) {
                this.scene.start('GameScene', { 
                    mode: 'remote',
                    game: data.game,
                    player: 'X',
                    qr_url: data.qr_url
                });
            }
        } catch (error) {
            console.error('Failed to create game:', error);
        }
    }

    showJoinInput() {
        // Create input overlay
        const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8)
            .setOrigin(0);

        const inputBg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, 400, 200, 0xecf0f1)
            .setOrigin(0.5);

        this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 50, 'Enter Game Code:', {
            fontSize: '20px',
            color: '#2c3e50'
        }).setOrigin(0.5);

        // Create HTML input element
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter 6-character code';
        input.style.position = 'absolute';
        input.style.left = '50%';
        input.style.top = '50%';
        input.style.transform = 'translate(-50%, -50%)';
        input.style.fontSize = '18px';
        input.style.padding = '10px';
        input.style.textAlign = 'center';
        input.style.textTransform = 'uppercase';
        input.style.maxLength = '6';
        input.style.width = '200px';
        input.style.border = '2px solid #3498db';
        input.style.borderRadius = '5px';
        document.body.appendChild(input);
        input.focus();

        const joinBtn = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 30, 'Join Game', {
            fontSize: '18px',
            color: '#fff',
            backgroundColor: '#3498db',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const cancelBtn = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 70, 'Cancel', {
            fontSize: '16px',
            color: '#7f8c8d'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const cleanup = () => {
            document.body.removeChild(input);
            overlay.destroy();
            inputBg.destroy();
            joinBtn.destroy();
            cancelBtn.destroy();
            this.children.list.filter(child => child.type === 'Text' && child.text === 'Enter Game Code:')[0]?.destroy();
        };

        joinBtn.on('pointerdown', async () => {
            const code = input.value.trim().toUpperCase();
            if (code.length === 6) {
                cleanup();
                await this.joinRemoteGame(code);
            }
        });

        cancelBtn.on('pointerdown', cleanup);

        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && input.value.trim().length === 6) {
                const code = input.value.trim().toUpperCase();
                cleanup();
                await this.joinRemoteGame(code);
            } else if (e.key === 'Escape') {
                cleanup();
            }
        });
    }

    async joinRemoteGame(code) {
        try {
            const response = await fetch(`/api/games/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: PLAYER_ID })
            });
            
            const data = await response.json();
            if (data.success) {
                this.scene.start('GameScene', { 
                    mode: 'remote',
                    game: data.game,
                    player: data.player
                });
            } else {
                alert(data.message || 'Failed to join game');
            }
        } catch (error) {
            console.error('Failed to join game:', error);
            alert('Failed to join game. Please check your connection.');
        }
    }

    checkAutoJoin() {
        const path = window.location.pathname;
        const joinMatch = path.match(/^\/join\/([A-Z0-9]{6})$/);
        if (joinMatch) {
            const code = joinMatch[1];
            setTimeout(() => this.joinRemoteGame(code), 500);
        }
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gameMode = data.mode || 'local';
        this.gameData = data.game || null;
        this.myPlayer = data.player || 'X';
        this.qrUrl = data.qr_url || null;
        
        // Initialize game state
        this.resetGameState();
        
        // Set up websocket connection for remote games
        if (this.gameMode === 'remote' && this.gameData) {
            this.setupWebSocket();
        }
    }

    resetGameState() {
        if (this.gameMode === 'remote' && this.gameData && this.gameData.game_state) {
            // Load game state from server
            const state = this.gameData.game_state;
            this.grids = state.grids;
            this.gridWinners = state.grid_winners;
            this.currentPlayer = state.current_player;
            this.activeGrid = state.active_grid;
            this.gameOver = state.game_over;
            this.winner = state.winner;
            this.firstMove = this.activeGrid === null;
        } else {
            // Initialize new local game
            this.grids = [];
            for (let i = 0; i < TOTAL_GRIDS; i++) {
                this.grids[i] = new Array(9).fill(null);
            }
            
            this.gridWinners = new Array(TOTAL_GRIDS).fill(null);
            this.currentPlayer = 'X';
            this.activeGrid = null;
            this.firstMove = true;
            this.gameOver = false;
            this.winner = null;
        }
    }

    setupWebSocket() {
        if (!this.gameData) return;
        
        this.channel = window.Echo.channel(`game.${this.gameData.code}`);
        
        this.channel.listen('game-updated', (data) => {
            console.log('Game updated:', data);
            this.gameData = data.game;
            this.updateFromServer();
            this.updateDisplay();
        });
    }

    updateFromServer() {
        if (!this.gameData || !this.gameData.game_state) return;
        
        const state = this.gameData.game_state;
        this.grids = state.grids;
        this.gridWinners = state.grid_winners;
        this.currentPlayer = state.current_player;
        this.activeGrid = state.active_grid;
        this.gameOver = state.game_over;
        this.winner = state.winner;
        this.firstMove = this.activeGrid === null;
    }

    preload() {
        // Hide loading text
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';

        // Create simple colored rectangles for UI elements
        this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hEgVWwAAAABJRU5ErkJggg==');
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#f0f0f0');

        // Create UI elements
        this.createUI();
        
        // Create game grids
        this.createGrids();
        
        // Setup input handlers
        this.setupInput();
        
        // Update display
        this.updateDisplay();
    }

    createUI() {
        const centerX = GAME_WIDTH / 2;
        
        // Title
        this.titleText = this.add.text(centerX, 25, '🎮 NINES 🎮', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Game mode and connection info
        if (this.gameMode === 'remote') {
            const statusColor = this.gameData?.status === 'playing' ? '#27ae60' : '#f39c12';
            const statusText = this.gameData?.status === 'playing' ? 'Online Game' : 'Waiting for Player...';
            
            this.connectionText = this.add.text(centerX, 55, `🌐 ${statusText}`, {
                fontSize: '16px',
                color: statusColor
            }).setOrigin(0.5);

            if (this.gameData?.code) {
                this.codeText = this.add.text(centerX, 75, `Game Code: ${this.gameData.code}`, {
                    fontSize: '14px',
                    color: '#666',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            }

            // Show QR code for game creator
            if (this.qrUrl && this.myPlayer === 'X') {
                this.qrButton = this.add.text(GAME_WIDTH - 80, 30, '📱 QR', {
                    fontSize: '14px',
                    color: '#fff',
                    backgroundColor: '#3498db',
                    padding: { x: 10, y: 5 }
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });

                this.qrButton.on('pointerdown', () => {
                    window.open(`/api/games/${this.gameData.code}/qr`, '_blank');
                });
            }
        } else {
            this.connectionText = this.add.text(centerX, 55, '🏠 Local Game', {
                fontSize: '16px',
                color: '#3498db'
            }).setOrigin(0.5);
        }

        // Current player info
        this.playerText = this.add.text(centerX, 95, '', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(0.5);

        // Active grid info
        this.activeGridText = this.add.text(centerX, 115, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#666'
        }).setOrigin(0.5);

        // Back to menu button
        this.backBtn = this.add.text(50, 30, '← Back', {
            fontSize: '16px',
            color: '#666'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.backBtn.on('pointerdown', () => {
            if (this.channel) {
                this.channel.stopListening('game-updated');
            }
            this.scene.start('MenuScene');
        });

        // Reset button (only for local games)
        if (this.gameMode === 'local') {
            this.resetBtn = this.add.text(centerX, GAME_HEIGHT - 30, 'New Game', {
                fontSize: '16px',
                color: '#fff',
                backgroundColor: '#4CAF50',
                padding: { x: 15, y: 8 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            this.resetBtn.on('pointerdown', () => {
                this.resetGame();
            });
        }

        // Game over modal elements (initially hidden)
        this.createGameOverModal();
    }

    createGameOverModal() {
        // Modal background
        this.modalBg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
            .setVisible(false);

        // Modal content
        this.modalContent = this.add.container(GAME_WIDTH/2, GAME_HEIGHT/2);

        const modalBox = this.add.rectangle(0, 0, 400, 200, 0xffffff)
            .setStrokeStyle(2, 0x333333);

        this.gameResultText = this.add.text(0, -30, '', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#333',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        const playAgainBtn = this.add.text(0, 30, 'Play Again', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: '#4CAF50',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playAgainBtn.on('pointerdown', () => {
            this.hideGameOverModal();
            this.resetGame();
        });

        this.modalContent.add([modalBox, this.gameResultText, playAgainBtn]);
        this.modalContent.setVisible(false);
    }

    createGrids() {
        this.gridContainers = [];
        this.cellElements = [];
        
        const startX = (GAME_WIDTH - (CELL_SIZE * GRID_SIZE * GRID_SIZE + GRID_PADDING * 2)) / 2;
        const startY = 130;

        for (let gridIndex = 0; gridIndex < TOTAL_GRIDS; gridIndex++) {
            const gridRow = Math.floor(gridIndex / GRID_SIZE);
            const gridCol = gridIndex % GRID_SIZE;
            
            const gridX = startX + gridCol * (CELL_SIZE * GRID_SIZE + GRID_PADDING);
            const gridY = startY + gridRow * (CELL_SIZE * GRID_SIZE + GRID_PADDING);

            // Create grid container
            const gridContainer = this.add.container(gridX, gridY);
            this.gridContainers.push(gridContainer);

            // Grid background
            const gridBg = this.add.rectangle(
                CELL_SIZE * GRID_SIZE / 2, 
                CELL_SIZE * GRID_SIZE / 2, 
                CELL_SIZE * GRID_SIZE + 4, 
                CELL_SIZE * GRID_SIZE + 4, 
                0x333333
            );
            gridContainer.add(gridBg);

            // Grid header with number
            const gridHeader = this.add.text(
                CELL_SIZE * GRID_SIZE / 2, 
                -15, 
                `Grid ${gridIndex + 1}`, 
                {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: '#333',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5);
            gridContainer.add(gridHeader);

            // Create cells for this grid
            this.cellElements[gridIndex] = [];
            
            for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
                const cellRow = Math.floor(cellIndex / GRID_SIZE);
                const cellCol = cellIndex % GRID_SIZE;
                
                const cellX = cellCol * CELL_SIZE + CELL_SIZE / 2;
                const cellY = cellRow * CELL_SIZE + CELL_SIZE / 2;

                // Cell background
                const cellBg = this.add.rectangle(cellX, cellY, CELL_SIZE - 2, CELL_SIZE - 2, 0xf8f9fa)
                    .setStrokeStyle(2, 0xe9ecef)
                    .setInteractive({ useHandCursor: true });

                // Cell text for position number or player mark
                const cellText = this.add.text(cellX, cellY, (cellIndex + 1).toString(), {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: '#666'
                }).setOrigin(0.5);

                // Store references
                this.cellElements[gridIndex][cellIndex] = {
                    background: cellBg,
                    text: cellText
                };

                // Add click handler
                cellBg.on('pointerdown', () => {
                    this.onCellClick(gridIndex, cellIndex);
                });

                gridContainer.add([cellBg, cellText]);
            }

            // Grid win overlay (initially hidden)
            const winOverlay = this.add.text(
                CELL_SIZE * GRID_SIZE / 2,
                CELL_SIZE * GRID_SIZE / 2,
                '',
                {
                    fontSize: '60px',
                    fontFamily: 'Arial',
                    color: '#333',
                    fontStyle: 'bold'
                }
            ).setOrigin(0.5).setVisible(false);
            
            gridContainer.add(winOverlay);
            this.cellElements[gridIndex].winOverlay = winOverlay;
        }
    }

    setupInput() {
        // Mobile-friendly input handling
        this.input.addPointer(2); // Support multi-touch
        
        // Handle device ready for Cordova
        if (typeof window.cordova !== 'undefined') {
            document.addEventListener('deviceready', () => {
                console.log('Cordova device ready');
            }, false);
        }
    }

    onCellClick(gridIndex, cellIndex) {
        if (this.gameOver) return;

        if (!this.isValidMove(gridIndex, cellIndex)) {
            // Visual feedback for invalid move
            this.showInvalidMoveEffect(gridIndex, cellIndex);
            return;
        }

        // For remote games, check if it's our turn and send to server
        if (this.gameMode === 'remote') {
            if (this.currentPlayer !== this.myPlayer) {
                return; // Not our turn
            }
            
            if (this.gameData?.status !== 'playing') {
                return; // Game not active
            }

            // Send move to server
            this.sendMoveToServer(gridIndex, cellIndex);
            return;
        }

        this.makeMove(gridIndex, cellIndex);
        this.updateDisplay();
        
        if (this.checkWinner()) {
            this.endGame(this.winner);
        } else if (this.isGameDraw()) {
            this.endGame(null); // Draw
        }
    }

    async sendMoveToServer(gridIndex, cellIndex) {
        if (!this.gameData?.code) return;
        
        try {
            const response = await fetch(`/api/games/${this.gameData.code}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: PLAYER_ID,
                    grid: gridIndex,
                    position: cellIndex
                })
            });
            
            const data = await response.json();
            if (!data.success) {
                console.error('Move failed:', data.message);
                // Could show user feedback here
            }
        } catch (error) {
            console.error('Failed to send move:', error);
        }
    }

    showInvalidMoveEffect(gridIndex, cellIndex) {
        if (this.cellElements[gridIndex] && this.cellElements[gridIndex][cellIndex]) {
            const cell = this.cellElements[gridIndex][cellIndex];
            
            // Flash red briefly
            cell.background.setFillStyle(0xff6b6b);
            this.time.delayedCall(200, () => {
                if (this.grids[gridIndex][cellIndex] === '') {
                    cell.background.setFillStyle(0xf8f9fa);
                }
            });
        }
    }

    isValidMove(gridIndex, cellIndex) {
        // Check if cell is already taken
        if (this.grids[gridIndex][cellIndex] !== '') return false;
        
        // Check if grid is already won
        if (this.gridWinners[gridIndex] !== '') return false;
        
        // For first move, any grid is valid
        if (this.firstMove) return true;
        
        // If active grid is full or won, can choose any available grid
        if (this.activeGrid !== null && 
            (this.gridWinners[this.activeGrid] !== '' || this.isGridFull(this.activeGrid))) {
            return this.gridWinners[gridIndex] === '' && !this.isGridFull(gridIndex);
        }
        
        // Must play in the active grid
        return this.activeGrid === null || gridIndex === this.activeGrid;
    }

    makeMove(gridIndex, cellIndex) {
        // Place the move
        this.grids[gridIndex][cellIndex] = this.currentPlayer;
        
        // Check if this move wins the grid
        if (this.checkGridWinner(gridIndex)) {
            this.gridWinners[gridIndex] = this.currentPlayer;
        }
        
        // Determine next active grid
        if (this.gridWinners[cellIndex] === '' && !this.isGridFull(cellIndex)) {
            this.activeGrid = cellIndex;
        } else {
            // Next player can choose any available grid
            this.activeGrid = null;
        }
        
        // Switch players
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.firstMove = false;
    }

    checkGridWinner(gridIndex) {
        const grid = this.grids[gridIndex];
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (let condition of winConditions) {
            const [a, b, c] = condition;
            if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
                return true;
            }
        }
        return false;
    }

    checkWinner() {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ];

        for (let condition of winConditions) {
            const [a, b, c] = condition;
            if (this.gridWinners[a] && 
                this.gridWinners[a] === this.gridWinners[b] && 
                this.gridWinners[a] === this.gridWinners[c]) {
                this.winner = this.gridWinners[a];
                return true;
            }
        }
        return false;
    }

    isGridFull(gridIndex) {
        return this.grids[gridIndex].every(cell => cell !== '');
    }

    isGameDraw() {
        // Game is a draw if all grids are either won or full, but no overall winner
        return this.gridWinners.every((winner, index) => 
            winner !== '' || this.isGridFull(index)
        );
    }

    updateDisplay() {
        // Update player info based on game mode
        const playerSymbol = this.currentPlayer === 'X' ? '❌' : '⭕';
        
        if (this.gameMode === 'remote') {
            const isMyTurn = this.currentPlayer === this.myPlayer;
            const mySymbol = this.myPlayer === 'X' ? '❌' : '⭕';
            
            if (this.gameData?.status === 'waiting') {
                this.playerText.setText(`${mySymbol} You are ${this.myPlayer} - Waiting for opponent...`);
                this.activeGridText.setText('Share your game code with a friend!');
            } else if (isMyTurn) {
                this.playerText.setText(`${mySymbol} Your turn!`);
                if (this.firstMove) {
                    this.activeGridText.setText('🎯 Choose any grid to start');
                } else if (this.activeGrid !== null) {
                    this.activeGridText.setText(`🎯 Must play in Grid ${this.activeGrid + 1}`);
                } else {
                    this.activeGridText.setText('🎯 Choose any available grid');
                }
            } else {
                this.playerText.setText(`${playerSymbol} Opponent's turn...`);
                this.activeGridText.setText('⏳ Waiting for opponent to move');
            }

            // Update connection status
            if (this.connectionText) {
                const statusColor = this.gameData?.status === 'playing' ? '#27ae60' : '#f39c12';
                const statusText = this.gameData?.status === 'playing' ? 'Online Game' : 'Waiting for Player...';
                this.connectionText.setColor(statusColor);
                this.connectionText.setText(`🌐 ${statusText}`);
            }
        } else {
            this.playerText.setText(`${playerSymbol} Player ${this.currentPlayer}'s turn`);
            
            if (this.firstMove) {
                this.activeGridText.setText(`🎯 Player ${this.currentPlayer} can choose any grid`);
            } else if (this.activeGrid !== null) {
                this.activeGridText.setText(`🎯 Must play in Grid ${this.activeGrid + 1}`);
            } else {
                this.activeGridText.setText(`🎯 Player ${this.currentPlayer} can choose any available grid`);
            }
        }

        // Update grid visuals
        this.updateGridVisuals();
    }

    updateGridVisuals() {
        for (let gridIndex = 0; gridIndex < TOTAL_GRIDS; gridIndex++) {
            const isActive = this.isGridActive(gridIndex);
            const isWon = this.gridWinners[gridIndex] !== '';
            
            // Update grid container style
            const gridContainer = this.gridContainers[gridIndex];
            const gridBg = gridContainer.getAt(0); // First element is the background
            
            if (isWon) {
                gridBg.setStrokeStyle(3, 0x666666);
                gridBg.setAlpha(0.6);
            } else if (isActive) {
                gridBg.setStrokeStyle(3, 0x4CAF50);
                gridBg.setAlpha(1);
            } else {
                gridBg.setStrokeStyle(2, 0x333333);
                gridBg.setAlpha(0.7);
            }

            // Update cells in this grid
            for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
                const cell = this.cellElements[gridIndex][cellIndex];
                const cellValue = this.grids[gridIndex][cellIndex];

                if (cellValue !== '') {
                    // Show player mark
                    const symbol = cellValue === 'X' ? '❌' : '⭕';
                    cell.text.setText(symbol);
                    cell.text.setStyle({ fontSize: '24px', color: '#333' });
                    cell.background.setFillStyle(0xe8f5e8);
                } else {
                    // Show position number
                    cell.text.setText((cellIndex + 1).toString());
                    cell.text.setStyle({ fontSize: '16px', color: '#666' });
                    
                    if (isActive && !isWon) {
                        cell.background.setFillStyle(0xf0fff0);
                    } else {
                        cell.background.setFillStyle(0xf8f9fa);
                    }
                }
            }

            // Show grid winner overlay
            const winOverlay = this.cellElements[gridIndex].winOverlay;
            if (isWon) {
                const winSymbol = this.gridWinners[gridIndex] === 'X' ? '❌' : '⭕';
                winOverlay.setText(winSymbol);
                winOverlay.setVisible(true);
            } else {
                winOverlay.setVisible(false);
            }
        }
    }

    isGridActive(gridIndex) {
        if (this.gameOver) return false;
        if (this.gridWinners[gridIndex] !== '') return false;
        if (this.isGridFull(gridIndex)) return false;
        
        if (this.firstMove) return true;
        
        if (this.activeGrid !== null) {
            return gridIndex === this.activeGrid;
        }
        
        // If no specific active grid, any non-won, non-full grid is active
        return true;
    }

    endGame(winner) {
        this.gameOver = true;
        this.showGameOverModal(winner);
    }

    showGameOverModal(winner) {
        let resultText;
        if (winner) {
            const winSymbol = winner === 'X' ? '❌' : '⭕';
            resultText = `${winSymbol} Player ${winner} Wins!\n🎉 Congratulations! 🎉`;
        } else {
            resultText = `🤝 It's a Draw!\nGreat game!`;
        }
        
        this.gameResultText.setText(resultText);
        this.modalBg.setVisible(true);
        this.modalContent.setVisible(true);
    }

    hideGameOverModal() {
        this.modalBg.setVisible(false);
        this.modalContent.setVisible(false);
    }

    resetGame() {
        this.hideGameOverModal();
        this.resetGameState();
        this.updateDisplay();
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#f0f0f0',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MenuScene, GameScene],
    render: {
        antialias: false,
        pixelArt: false
    },
    input: {
        activePointers: 3 // Support multi-touch
    }
};

// Initialize game based on environment
function initGame() {
    new Phaser.Game(config);
}

// Handle Cordova device ready event
if (typeof window.cordova !== 'undefined') {
    document.addEventListener('deviceready', initGame, false);
} else {
    // Web environment
    window.addEventListener('load', initGame);
}