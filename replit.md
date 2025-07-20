# Nines Game

## Overview

This is a comprehensive implementation of **Nines** featuring multiple versions: a Python console version, a modern web interface, and now a **Phaser.js game engine** version with **Laravel backend and real-time multiplayer capabilities**. The game features 9 interconnected grids (81 squares total) where players must strategically place their marks. The current version provides hardware-accelerated graphics, mobile-optimized touch controls, websocket communication for real-time multiplayer, and database storage for game persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**July 20, 2025:**
- ✓ Removed Cordova mobile deployment complexity per user request
- ✓ Simplified to web-only deployment with standard Laravel hosting
- ✓ Restructured project: moved Laravel files from backend/ to root level
- ✓ Placed composer.json in root directory for hosting provider compatibility
- ✓ Updated all paths and configuration for new structure
- ✓ Created comprehensive deployment guide (DEPLOYMENT.md)
- ✓ Cleaned up corrupted composer files from root directory
- ✓ Removed cordova-app folder (no longer needed for web-only deployment)

## System Architecture

The current active version uses **Full-Stack Real-time Multiplayer Architecture**:

**Architecture Pattern**: Client-Server with Real-time Communication
- **Rationale**: Enables online multiplayer gameplay with real-time synchronization, game persistence, and scalable user sessions
- **Pros**: Real-time multiplayer, database persistence, QR code sharing, mobile-optimized, professional game development
- **Cons**: More complex setup, requires backend infrastructure, higher resource usage

**Technology Stack**: 
- **Frontend**: Phaser.js 3.90.0 game engine with Webpack 5 build system
- **Backend**: Laravel 12.x PHP framework with PostgreSQL database
- **Real-time Communication**: Laravel Reverb WebSocket server
- **Game Logic**: Shared between frontend and backend for validation
- **Database**: PostgreSQL for game state persistence
- **Features**: QR code generation, shareable game codes, responsive design
- **Web Deployment**: Standard Laravel web hosting deployment

**Backend Services**:
- **Laravel Backend** (Port 8080): REST API for game management (moved for hosting compatibility)
- **Reverb WebSocket** (Port 8081): Real-time game state synchronization
- **PostgreSQL Database**: Game state persistence and player management

**Legacy Architectures** (Archived):
- **Python Console**: Simple class-based design for terminal gameplay  
- **Vanilla Web**: DOM-based implementation with responsive design

## Key Features

**Multiplayer Modes:**
- **Local Game**: Traditional offline gameplay for two players on same device
- **Remote Game Creation**: Host creates game with shareable 6-character code and QR code
- **Remote Game Joining**: Players join using game codes or QR code scanning

**Real-time Features:**
- **Live Game Synchronization**: All moves instantly synchronized between players
- **Game State Persistence**: Games saved to database and resume across sessions  
- **Connection Status**: Visual indicators for online/offline status
- **Turn Management**: Clear visual feedback for whose turn it is

**Technical Features:**
- **Mobile Optimized**: Touch-friendly interface, responsive design
- **QR Code Sharing**: Instant game sharing via QR codes
- **Hardware Acceleration**: Phaser.js WebGL/Canvas rendering
- **Cross-Platform**: All modern web browsers on desktop and mobile

## Key Components

## Project Structure

### Multiplayer Nines Game (Active)

**Frontend (Phaser.js):**
- `src/main.js`: Complete multiplayer game with MenuScene and GameScene
- `src/index.html`: Mobile-optimized HTML with real-time features
- `webpack.config.js`: Webpack with API proxy configuration
- `dist/`: Built production files (auto-generated)

**Backend (Laravel - Root Level):**
- `composer.json`: PHP dependencies in root for hosting compatibility
- `app/Models/Game.php`: Game model with state management
- `app/Http/Controllers/GameController.php`: REST API endpoints
- `app/Events/GameUpdated.php`: WebSocket broadcast events
- `database/migrations/`: Database schema for games table
- `routes/api.php`: API routes for game operations
- `routes/web.php`: Frontend serving routes
- `.env.example`: Configuration template with database and websocket settings

**Deployment:**
- Laravel application restructured with composer.json in root for hosting compatibility
- Web server document root points to `public/` directory
- All backend services configured for production deployment

### Legacy Versions (Archived)
- `legacy-versions/`: Contains previous implementations for reference
  - `main.py`: Original Python console version
  - `index.html.backup`: Original web HTML interface
  - `style.css.backup`: Original web CSS styling
  - `script.js.backup`: Original vanilla JavaScript implementation
  - `server.py.backup`: Simple Python HTTP server

### MegaTicTacToe Class (Python)
The main game class that encapsulates all mega tic tac toe functionality:

**Game State Management**:
- `grids`: List of 9 grids, each containing 9 positions (81 total squares)
- `grid_winners`: Tracks which grids have been won and by whom
- `current_player`: Tracks whose turn it is ('X' or 'O')
- `game_over`: Boolean flag for game completion
- `winner`: Stores the winning player or None
- `active_grid`: Which grid the next player must play in (None if any grid allowed)
- `first_move`: Boolean flag for first move (player can choose any grid)

**Display Methods**:
- `display_board()`: Renders all 9 grids in a 3x3 layout with clear visual separation
- `_get_grid_display()`: Helper method to render individual grid lines
- `display_instructions()`: Shows mega tic tac toe rules and input format

**Game Logic Methods**:
- `check_grid_winner()`: Checks if a specific grid has been won
- `check_winner()`: Checks if the overall mega game has been won
- `is_valid_move()`: Validates moves considering grid restrictions
- `make_move()`: Places marks and updates game state including active grid logic

**Design Decisions**:
- Uses nested lists for 9 grids (2D structure for complex game state)
- Position numbering (1-9) for both grid selection and position within grid
- Active grid system enforces the core mega tic tac toe rule
- Won grids display winner symbol instead of individual positions
- Comprehensive visual layout showing all 81 squares simultaneously

## Data Flow

1. **Game Initialization**: Creates 9 empty grids, sets X as starting player, enables first move flexibility
2. **Display Phase**: Shows all 9 grids with position numbers, indicates active grid restrictions
3. **Input Phase**: 
   - First move: Player chooses grid (1-9) then position (1-9)
   - Subsequent moves: Player restricted to specific grid, chooses position (1-9)
4. **Validation Phase**: Checks grid availability, position validity, and active grid restrictions
5. **Update Phase**: Places player's mark, checks for grid wins, determines next active grid
6. **Win Check Phase**: Evaluates individual grid wins and overall mega game victory
7. **Active Grid Logic**: Next player must play in grid matching position number of previous move
8. **Loop**: Returns to display phase unless mega game is won or drawn

## External Dependencies

**Standard Library Only**: The application uses only Python's built-in functionality
- **Rationale**: Keeps the game lightweight and eliminates dependency management
- **Pros**: No installation requirements, works on any Python environment
- **Cons**: Limited to basic console output formatting

## Deployment Strategy

**Local Execution**: Designed to run directly from the command line
- **Target Environment**: Any system with Python 3 installed
- **Execution**: `python3 main.py`
- **No Build Process**: Direct script execution

**Note**: The current code appears to be incomplete, showing only the class definition and initialization methods. The game loop, input handling, win condition checking, and main execution logic would need to be implemented to create a fully functional game.

## Potential Extensions

The current architecture could be extended to include:
- Game loop implementation
- Input validation and error handling
- Win condition detection algorithms
- Score tracking across multiple games
- AI opponent for single-player mode
- Web interface using a framework like Flask
- Multiplayer networking capabilities