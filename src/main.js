import 'phaser';

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRID_SIZE = 3;
const TOTAL_GRIDS = 9;
const CELL_SIZE = 60;
const GRID_PADDING = 10;

class MegaTicTacToeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MegaTicTacToeScene' });
    }

    init() {
        // Initialize game state
        this.resetGameState();
    }

    resetGameState() {
        // Initialize grids - 9 grids, each with 9 positions
        this.grids = [];
        for (let i = 0; i < TOTAL_GRIDS; i++) {
            this.grids[i] = new Array(9).fill('');
        }
        
        this.gridWinners = new Array(TOTAL_GRIDS).fill('');
        this.currentPlayer = 'X';
        this.activeGrid = null;
        this.firstMove = true;
        this.gameOver = false;
        this.winner = null;
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
        this.titleText = this.add.text(centerX, 30, '🎮 MEGA TIC TAC TOE 🎮', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Current player info
        this.playerText = this.add.text(centerX, 70, 'Player X\'s turn', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#333'
        }).setOrigin(0.5);

        // Active grid info
        this.activeGridText = this.add.text(centerX, 100, '🎯 Player X can choose any grid', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#666'
        }).setOrigin(0.5);

        // Reset button
        this.resetBtn = this.add.text(centerX, GAME_HEIGHT - 50, 'Reset Game', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: '#4CAF50',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.resetBtn.on('pointerdown', () => {
            this.resetGame();
        });

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

        this.makeMove(gridIndex, cellIndex);
        this.updateDisplay();
        
        if (this.checkWinner()) {
            this.endGame(this.winner);
        } else if (this.isGameDraw()) {
            this.endGame(null); // Draw
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
        // Update player info
        const playerSymbol = this.currentPlayer === 'X' ? '❌' : '⭕';
        this.playerText.setText(`${playerSymbol} Player ${this.currentPlayer}'s turn`);

        // Update active grid info
        if (this.firstMove) {
            this.activeGridText.setText(`🎯 Player ${this.currentPlayer} can choose any grid`);
        } else if (this.activeGrid !== null) {
            this.activeGridText.setText(`🎯 Must play in Grid ${this.activeGrid + 1}`);
        } else {
            this.activeGridText.setText(`🎯 Player ${this.currentPlayer} can choose any available grid`);
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
    scene: MegaTicTacToeScene,
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