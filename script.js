class MegaTicTacToe {
    constructor() {
        // Game state
        this.grids = Array(9).fill(null).map(() => Array(9).fill(null));
        this.gridWinners = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.activeGrid = null;
        this.firstMove = true;
        
        // DOM elements
        this.gameBoard = document.getElementById('game-board');
        this.currentPlayerSymbol = document.getElementById('current-player-symbol');
        this.currentPlayerText = document.getElementById('current-player-text');
        this.activeGridInfo = document.getElementById('active-grid-info');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.gameResult = document.getElementById('game-result');
        this.gameMessage = document.getElementById('game-message');
        this.resetButton = document.getElementById('reset-game');
        this.playAgainButton = document.getElementById('play-again');
        this.menuToggle = document.getElementById('menu-toggle');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.menuClose = document.getElementById('menu-close');
        
        this.initializeEventListeners();
        this.updateDisplay();
    }
    
    initializeEventListeners() {
        // Cell click events
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });
        
        // Control buttons
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.playAgainButton.addEventListener('click', () => {
            this.resetGame();
            this.gameOverModal.style.display = 'none';
        });
        
        // Close modal on background click
        this.gameOverModal.addEventListener('click', (e) => {
            if (e.target === this.gameOverModal) {
                this.gameOverModal.style.display = 'none';
            }
        });
        
        // Mobile menu controls
        this.menuToggle.addEventListener('click', () => {
            this.mobileMenu.classList.add('active');
        });
        
        this.menuClose.addEventListener('click', () => {
            this.mobileMenu.classList.remove('active');
        });
        
        // Close mobile menu on background click
        this.mobileMenu.addEventListener('click', (e) => {
            if (e.target === this.mobileMenu) {
                this.mobileMenu.classList.remove('active');
            }
        });
    }
    
    handleCellClick(event) {
        if (this.gameOver) return;
        
        const cell = event.target;
        const gridNum = parseInt(cell.dataset.grid);
        const position = parseInt(cell.dataset.position);
        
        if (this.isValidMove(gridNum, position)) {
            this.makeMove(gridNum, position);
            this.updateDisplay();
            
            // Check for game end
            const result = this.checkWinner();
            if (result) {
                this.gameOver = true;
                this.winner = result;
                setTimeout(() => this.showGameResult(), 500);
            } else {
                this.switchPlayer();
                this.updateDisplay();
            }
        }
    }
    
    isValidMove(gridNum, position) {
        // Check if grid and position are in valid range
        if (gridNum < 0 || gridNum > 8 || position < 0 || position > 8) {
            return false;
        }
        
        // Check if grid is already won
        if (this.gridWinners[gridNum] !== null) {
            return false;
        }
        
        // Check if position is empty
        if (this.grids[gridNum][position] !== null) {
            return false;
        }
        
        // Check if player is allowed to play in this grid
        if (!this.firstMove && this.activeGrid !== null && gridNum !== this.activeGrid) {
            return false;
        }
        
        return true;
    }
    
    makeMove(gridNum, position) {
        this.grids[gridNum][position] = this.currentPlayer;
        
        // Check if this move wins the grid
        const gridWinner = this.checkGridWinner(gridNum);
        if (gridWinner) {
            this.gridWinners[gridNum] = gridWinner;
        }
        
        // Set next active grid based on position played
        // If that grid is won, player can choose any available grid
        if (this.gridWinners[position] === null) {
            this.activeGrid = position;
        } else {
            this.activeGrid = null;
        }
        
        this.firstMove = false;
    }
    
    checkGridWinner(gridNum) {
        const grid = this.grids[gridNum];
        
        // Define all possible winning combinations
        const winningCombinations = [
            // Rows
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            // Columns
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            // Diagonals
            [0, 4, 8], [2, 4, 6]
        ];
        
        // Check for winning combinations
        for (const combo of winningCombinations) {
            if (grid[combo[0]] && 
                grid[combo[0]] === grid[combo[1]] && 
                grid[combo[1]] === grid[combo[2]]) {
                return grid[combo[0]];
            }
        }
        
        // Check for draw (grid full)
        if (grid.every(cell => cell !== null)) {
            return 'Draw';
        }
        
        return null;
    }
    
    checkWinner() {
        // Define all possible winning combinations for the mega board
        const winningCombinations = [
            // Rows
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            // Columns
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            // Diagonals
            [0, 4, 8], [2, 4, 6]
        ];
        
        // Check for winning combinations
        for (const combo of winningCombinations) {
            if (this.gridWinners[combo[0]] && 
                this.gridWinners[combo[0]] === this.gridWinners[combo[1]] && 
                this.gridWinners[combo[1]] === this.gridWinners[combo[2]] &&
                this.gridWinners[combo[0]] !== 'Draw') {
                return this.gridWinners[combo[0]];
            }
        }
        
        // Check for draw (all grids decided)
        if (this.gridWinners.every(winner => winner !== null)) {
            return 'Draw';
        }
        
        return null;
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }
    
    updateDisplay() {
        // Update current player display
        this.currentPlayerSymbol.textContent = this.currentPlayer === 'X' ? '❌' : '⭕';
        this.currentPlayerText.textContent = `Player ${this.currentPlayer}'s turn`;
        
        // Update active grid info
        if (this.activeGrid !== null) {
            this.activeGridInfo.textContent = `🎯 Next move must be in Grid ${this.activeGrid + 1}`;
        } else if (this.firstMove) {
            this.activeGridInfo.textContent = `🎯 Player ${this.currentPlayer} can choose any grid`;
        } else {
            const availableGrids = [];
            for (let i = 0; i < 9; i++) {
                if (this.gridWinners[i] === null) {
                    availableGrids.push(i + 1);
                }
            }
            this.activeGridInfo.textContent = `🎯 Choose any available grid: ${availableGrids.join(', ')}`;
        }
        
        // Update grid displays
        for (let gridNum = 0; gridNum < 9; gridNum++) {
            this.updateGridDisplay(gridNum);
        }
        
        // Update cell displays
        this.updateCellDisplays();
    }
    
    updateGridDisplay(gridNum) {
        const gridElement = document.getElementById(`grid-${gridNum}`);
        const miniGrid = gridElement.querySelector('.mini-grid');
        
        // Remove all classes
        gridElement.classList.remove('active', 'inactive', 'won', 'x', 'o');
        
        // Check if grid is won
        if (this.gridWinners[gridNum]) {
            gridElement.classList.add('won');
            if (this.gridWinners[gridNum] !== 'Draw') {
                gridElement.classList.add(this.gridWinners[gridNum].toLowerCase());
                miniGrid.setAttribute('data-winner', this.gridWinners[gridNum]);
            } else {
                miniGrid.setAttribute('data-winner', 'DRAW');
            }
        } else {
            miniGrid.removeAttribute('data-winner');
            
            // Determine if grid is active or inactive
            if (this.firstMove || this.activeGrid === null || this.activeGrid === gridNum) {
                gridElement.classList.add('active');
            } else {
                gridElement.classList.add('inactive');
            }
        }
    }
    
    updateCellDisplays() {
        document.querySelectorAll('.cell').forEach(cell => {
            const gridNum = parseInt(cell.dataset.grid);
            const position = parseInt(cell.dataset.position);
            const cellValue = this.grids[gridNum][position];
            
            // Remove all classes
            cell.classList.remove('taken', 'x', 'o', 'disabled');
            
            if (cellValue) {
                // Cell is taken
                cell.classList.add('taken', cellValue.toLowerCase());
                cell.textContent = cellValue;
            } else {
                // Cell is empty
                cell.textContent = position + 1;
                
                // Check if cell should be disabled
                if (!this.isValidMove(gridNum, position)) {
                    cell.classList.add('disabled');
                }
            }
        });
    }
    
    showGameResult() {
        if (this.winner === 'Draw') {
            this.gameResult.textContent = '🤝 It\'s a Draw!';
            this.gameMessage.textContent = 'All grids are filled - well played by both players!';
        } else {
            this.gameResult.textContent = `🎉 Player ${this.winner} Wins!`;
            this.gameMessage.textContent = `Congratulations to Player ${this.winner} for winning 3 grids in a row!`;
        }
        
        this.gameOverModal.style.display = 'block';
    }
    
    resetGame() {
        // Reset game state
        this.grids = Array(9).fill(null).map(() => Array(9).fill(null));
        this.gridWinners = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.activeGrid = null;
        this.firstMove = true;
        
        // Update display
        this.updateDisplay();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MegaTicTacToe();
});