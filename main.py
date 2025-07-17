#!/usr/bin/env python3
"""
MEGA TIC TAC TOE Game
A console-based two-player game with 9 interconnected grids (81 squares total).
"""

class MegaTicTacToe:
    def __init__(self):
        """Initialize the game with 9 empty grids and starting player."""
        # 9 grids, each with 9 positions (81 total squares)
        self.grids = [[' ' for _ in range(9)] for _ in range(9)]
        # Track which grids have been won and by whom
        self.grid_winners = [None for _ in range(9)]
        self.current_player = 'X'  # X always starts first
        self.game_over = False
        self.winner = None
        self.active_grid = None  # Which grid the next player must play in
        self.first_move = True  # First player can choose any grid
        
    def display_board(self):
        """Display the mega board with all 9 grids in a 3x3 layout."""
        print("\n" + "="*65)
        print("                    MEGA TIC TAC TOE")
        print("="*65)
        
        # Show active grid info
        if self.active_grid is not None:
            print(f"\n🎯 Next move must be in Grid {self.active_grid + 1}")
        elif self.first_move:
            print(f"\n🎯 Player {self.current_player} can choose any grid")
        print()
        
        # Display grid numbers at the top
        print("   Grid 1      Grid 2      Grid 3")
        print()
        
        # Display the mega board - 3 rows of grids
        for grid_row in range(3):
            # Each grid has 3 rows, so we need to display 3 lines for each grid row
            for line in range(3):
                row_output = ""
                for grid_col in range(3):
                    grid_num = grid_row * 3 + grid_col
                    grid_display = self._get_grid_display(grid_num, line)
                    row_output += grid_display
                    if grid_col < 2:
                        row_output += " || "
                print(row_output)
            
            # Add separator between grid rows
            if grid_row < 2:
                print("=" * 65)
                print(f"   Grid {grid_row * 3 + 4}      Grid {grid_row * 3 + 5}      Grid {grid_row * 3 + 6}")
                print()
        
        print()
        
    def _get_grid_display(self, grid_num, line):
        """Get a single line of a grid display."""
        grid = self.grids[grid_num]
        
        # If grid is won, show the winner symbol
        if self.grid_winners[grid_num]:
            winner = self.grid_winners[grid_num]
            if line == 1:  # Middle line
                return f"    {winner}     "
            else:
                return "          "
        
        # Show normal grid content
        start_pos = line * 3
        display_line = ""
        for i in range(3):
            pos = start_pos + i
            if grid[pos] == ' ':
                # Show position number if grid is active or first move
                if self.active_grid == grid_num or self.first_move:
                    display_line += f" {pos + 1} "
                else:
                    display_line += "   "
            else:
                display_line += f" {grid[pos]} "
            
            if i < 2:
                display_line += "|"
        
        return display_line
        
    def display_instructions(self):
        """Display game instructions and input format."""
        print("🎮 MEGA TIC TAC TOE RULES:")
        print("- There are 9 grids (numbered 1-9) arranged in a 3x3 layout")
        print("- Each grid has 9 positions (numbered 1-9)")
        print("- First player can choose any grid to start")
        print("- After that, you must play in the grid matching the position number")
        print("  of the previous player's move")
        print("- Win a grid by getting 3 in a row within that grid")
        print("- Win the game by getting 3 grids in a row!")
        print("- Input format: First enter grid number (1-9), then position (1-9)")
        print()
        
    def is_valid_move(self, grid_num, position):
        """
        Check if a move is valid in the specified grid.
        
        Args:
            grid_num (int): The grid number (0-8)
            position (int): The position within the grid (0-8)
            
        Returns:
            bool: True if move is valid, False otherwise
        """
        # Check if grid and position are in valid range
        if not (0 <= grid_num < 9 and 0 <= position < 9):
            return False
        
        # Check if grid is already won
        if self.grid_winners[grid_num] is not None:
            return False
        
        # Check if position is empty
        if self.grids[grid_num][position] != ' ':
            return False
        
        # Check if player is allowed to play in this grid
        if not self.first_move and self.active_grid is not None and grid_num != self.active_grid:
            return False
        
        return True
    
    def make_move(self, grid_num, position):
        """
        Make a move on the specified grid.
        
        Args:
            grid_num (int): The grid number (0-8)
            position (int): The position within the grid (0-8)
        """
        if self.is_valid_move(grid_num, position):
            self.grids[grid_num][position] = self.current_player
            
            # Check if this move wins the grid
            grid_winner = self.check_grid_winner(grid_num)
            if grid_winner:
                self.grid_winners[grid_num] = grid_winner
            
            # Set next active grid based on position played
            # If that grid is won, player can choose any available grid
            if self.grid_winners[position] is None:
                self.active_grid = position
            else:
                self.active_grid = None
            
            self.first_move = False
            return True
        return False
    
    def check_grid_winner(self, grid_num):
        """
        Check if there's a winner in a specific grid.
        
        Args:
            grid_num (int): The grid number (0-8)
            
        Returns:
            str: 'X', 'O', 'Draw', or None
        """
        grid = self.grids[grid_num]
        
        # Define all possible winning combinations
        winning_combinations = [
            # Rows
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            # Columns  
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            # Diagonals
            [0, 4, 8], [2, 4, 6]
        ]
        
        # Check for winning combinations
        for combo in winning_combinations:
            if (grid[combo[0]] == grid[combo[1]] == grid[combo[2]] 
                and grid[combo[0]] != ' '):
                return grid[combo[0]]
        
        # Check for draw (grid full)
        if ' ' not in grid:
            return 'Draw'
            
        return None
    
    def check_winner(self):
        """
        Check if there's a winner of the entire mega game.
        
        Returns:
            str: 'X', 'O', 'Draw', or None
        """
        # Define all possible winning combinations for the mega board
        winning_combinations = [
            # Rows
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            # Columns  
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            # Diagonals
            [0, 4, 8], [2, 4, 6]
        ]
        
        # Check for winning combinations
        for combo in winning_combinations:
            if (self.grid_winners[combo[0]] == self.grid_winners[combo[1]] == self.grid_winners[combo[2]] 
                and self.grid_winners[combo[0]] is not None 
                and self.grid_winners[combo[0]] != 'Draw'):
                return self.grid_winners[combo[0]]
        
        # Check for draw (all grids decided)
        if all(winner is not None for winner in self.grid_winners):
            return 'Draw'
            
        return None
    
    def switch_player(self):
        """Switch to the other player."""
        self.current_player = 'O' if self.current_player == 'X' else 'X'
    
    def get_player_input(self):
        """
        Get and validate player input for mega tic tac toe.
        
        Returns:
            tuple: (grid_num, position) both 0-8 indexed, or (-1, -1) for invalid input
        """
        try:
            # First move or when active grid is None (target grid was won)
            if self.first_move or self.active_grid is None:
                # Player chooses grid first
                available_grids = [i+1 for i in range(9) if self.grid_winners[i] is None]
                print(f"Available grids: {available_grids}")
                
                grid_input = input(f"Player {self.current_player}, choose grid (1-9): ").strip()
                
                if not grid_input.isdigit():
                    print("❌ Error: Please enter a grid number between 1 and 9.")
                    return (-1, -1)
                    
                grid_num = int(grid_input) - 1  # Convert to 0-based index
                
                if not (0 <= grid_num <= 8):
                    print("❌ Error: Please enter a grid number between 1 and 9.")
                    return (-1, -1)
                    
                if self.grid_winners[grid_num] is not None:
                    print("❌ Error: That grid is already won! Choose a different grid.")
                    return (-1, -1)
            else:
                # Player must use the specified active grid
                grid_num = self.active_grid
                print(f"You must play in Grid {grid_num + 1}")
            
            # Now get position within the grid
            position_input = input(f"Player {self.current_player}, choose position in grid (1-9): ").strip()
            
            if not position_input.isdigit():
                print("❌ Error: Please enter a position number between 1 and 9.")
                return (-1, -1)
                
            position = int(position_input) - 1  # Convert to 0-based index
            
            if not (0 <= position <= 8):
                print("❌ Error: Please enter a position number between 1 and 9.")
                return (-1, -1)
                
            if not self.is_valid_move(grid_num, position):
                print("❌ Error: That position is already taken! Choose an empty position.")
                return (-1, -1)
                
            return (grid_num, position)
            
        except KeyboardInterrupt:
            print("\n\n👋 Game interrupted. Thanks for playing!")
            exit(0)
        except Exception as e:
            print(f"❌ Error: Invalid input. Please try again.")
            return (-1, -1)
    
    def display_game_result(self):
        """Display the final game result."""
        print("\n" + "="*50)
        if self.winner == 'Draw':
            print("🤝 MEGA TIC TAC TOE RESULT: It's a draw!")
            print("All grids are filled - well played by both players!")
        else:
            print(f"🎉 MEGA TIC TAC TOE RESULT: Player {self.winner} wins!")
            print(f"Congratulations to Player {self.winner} for winning 3 grids in a row!")
        print("="*50)
    
    def ask_play_again(self):
        """
        Ask players if they want to play again.
        
        Returns:
            bool: True if players want to play again, False otherwise
        """
        while True:
            try:
                choice = input("\nWould you like to play another mega game? (y/n): ").strip().lower()
                if choice in ['y', 'yes']:
                    return True
                elif choice in ['n', 'no']:
                    return False
                else:
                    print("Please enter 'y' for yes or 'n' for no.")
            except KeyboardInterrupt:
                print("\n\n👋 Thanks for playing!")
                return False
    
    def reset_game(self):
        """Reset the game to initial state."""
        self.grids = [[' ' for _ in range(9)] for _ in range(9)]
        self.grid_winners = [None for _ in range(9)]
        self.current_player = 'X'
        self.game_over = False
        self.winner = None
        self.active_grid = None
        self.first_move = True
    
    def play_game(self):
        """Main game loop."""
        # Display welcome message and instructions
        print("\n🎮 Welcome to MEGA TIC TAC TOE! 🎮")
        self.display_instructions()
        
        while True:
            # Main game loop
            while not self.game_over:
                # Display current board state
                self.display_board()
                
                # Show whose turn it is
                symbol = "❌" if self.current_player == 'X' else "⭕"
                print(f"{symbol} Player {self.current_player}'s turn")
                
                # Get player input
                grid_num, position = self.get_player_input()
                
                # Skip turn if input was invalid
                if grid_num == -1 or position == -1:
                    continue
                
                # Make the move
                if self.make_move(grid_num, position):
                    # Check for game end
                    result = self.check_winner()
                    if result:
                        self.game_over = True
                        self.winner = result
                    else:
                        # Switch to next player
                        self.switch_player()
                else:
                    print("❌ Move failed. Please try again.")
            
            # Display final board and result
            self.display_board()
            self.display_game_result()
            
            # Ask if players want to play again
            if self.ask_play_again():
                self.reset_game()
                print("\n🔄 Starting new mega game...\n")
            else:
                print("\n👋 Thanks for playing MEGA TIC TAC TOE!")
                print("Hope you had fun! 🎉")
                break


def main():
    """Main function to start the game."""
    try:
        game = MegaTicTacToe()
        game.play_game()
    except KeyboardInterrupt:
        print("\n\n👋 Game interrupted. Thanks for playing!")
    except Exception as e:
        print(f"\n❌ An unexpected error occurred: {e}")
        print("Please restart the game.")


if __name__ == "__main__":
    main()
