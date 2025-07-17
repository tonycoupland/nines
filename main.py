#!/usr/bin/env python3
"""
Noughts and Crosses (Tic-Tac-Toe) Game
A console-based two-player game with text UI for local play.
"""

class NoughtsAndCrosses:
    def __init__(self):
        """Initialize the game with an empty board and starting player."""
        self.board = [' ' for _ in range(9)]  # 9 positions for 3x3 grid
        self.current_player = 'X'  # X always starts first
        self.game_over = False
        self.winner = None
        
    def display_board(self):
        """Display the current game board in a clear 3x3 format."""
        print("\n" + "="*25)
        print("   NOUGHTS AND CROSSES")
        print("="*25)
        print("\nCurrent Board:")
        print()
        
        # Display the board with position numbers for empty spaces
        for i in range(3):
            row = ""
            for j in range(3):
                pos = i * 3 + j
                if self.board[pos] == ' ':
                    row += f" {pos + 1} "
                else:
                    row += f" {self.board[pos]} "
                
                if j < 2:
                    row += "|"
            
            print(row)
            if i < 2:
                print("-----------")
        
        print()
        
    def display_instructions(self):
        """Display game instructions and input format."""
        print("How to play:")
        print("- Enter a number (1-9) to place your mark")
        print("- Numbers correspond to positions on the board")
        print("- Player X goes first, then Player O")
        print("- Get 3 in a row (horizontal, vertical, or diagonal) to win!")
        print()
        
    def is_valid_move(self, position):
        """
        Check if a move is valid.
        
        Args:
            position (int): The board position (0-8)
            
        Returns:
            bool: True if move is valid, False otherwise
        """
        return 0 <= position < 9 and self.board[position] == ' '
    
    def make_move(self, position):
        """
        Make a move on the board.
        
        Args:
            position (int): The board position (0-8)
        """
        if self.is_valid_move(position):
            self.board[position] = self.current_player
            return True
        return False
    
    def check_winner(self):
        """
        Check if there's a winner or if the game is a draw.
        
        Returns:
            str: 'X', 'O', 'Draw', or None
        """
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
            if (self.board[combo[0]] == self.board[combo[1]] == self.board[combo[2]] 
                and self.board[combo[0]] != ' '):
                return self.board[combo[0]]
        
        # Check for draw (board full)
        if ' ' not in self.board:
            return 'Draw'
            
        return None
    
    def switch_player(self):
        """Switch to the other player."""
        self.current_player = 'O' if self.current_player == 'X' else 'X'
    
    def get_player_input(self):
        """
        Get and validate player input.
        
        Returns:
            int: Valid board position (0-8) or -1 for invalid input
        """
        try:
            position = input(f"Player {self.current_player}, enter your move (1-9): ").strip()
            
            if not position.isdigit():
                print("❌ Error: Please enter a number between 1 and 9.")
                return -1
                
            position = int(position) - 1  # Convert to 0-based index
            
            if not (0 <= position <= 8):
                print("❌ Error: Please enter a number between 1 and 9.")
                return -1
                
            if not self.is_valid_move(position):
                print("❌ Error: That position is already taken! Choose an empty position.")
                return -1
                
            return position
            
        except KeyboardInterrupt:
            print("\n\n👋 Game interrupted. Thanks for playing!")
            exit(0)
        except Exception as e:
            print(f"❌ Error: Invalid input. Please try again.")
            return -1
    
    def display_game_result(self):
        """Display the final game result."""
        print("\n" + "="*30)
        if self.winner == 'Draw':
            print("🤝 GAME RESULT: It's a draw!")
            print("Well played by both players!")
        else:
            print(f"🎉 GAME RESULT: Player {self.winner} wins!")
            print(f"Congratulations to Player {self.winner}!")
        print("="*30)
    
    def ask_play_again(self):
        """
        Ask players if they want to play again.
        
        Returns:
            bool: True if players want to play again, False otherwise
        """
        while True:
            try:
                choice = input("\nWould you like to play again? (y/n): ").strip().lower()
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
        self.board = [' ' for _ in range(9)]
        self.current_player = 'X'
        self.game_over = False
        self.winner = None
    
    def play_game(self):
        """Main game loop."""
        # Display welcome message and instructions
        print("\n🎮 Welcome to Noughts and Crosses! 🎮")
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
                position = self.get_player_input()
                
                # Skip turn if input was invalid
                if position == -1:
                    continue
                
                # Make the move
                self.make_move(position)
                
                # Check for game end
                result = self.check_winner()
                if result:
                    self.game_over = True
                    self.winner = result
                else:
                    # Switch to next player
                    self.switch_player()
            
            # Display final board and result
            self.display_board()
            self.display_game_result()
            
            # Ask if players want to play again
            if self.ask_play_again():
                self.reset_game()
                print("\n🔄 Starting new game...\n")
            else:
                print("\n👋 Thanks for playing Noughts and Crosses!")
                print("Hope you had fun! 🎉")
                break


def main():
    """Main function to start the game."""
    try:
        game = NoughtsAndCrosses()
        game.play_game()
    except KeyboardInterrupt:
        print("\n\n👋 Game interrupted. Thanks for playing!")
    except Exception as e:
        print(f"\n❌ An unexpected error occurred: {e}")
        print("Please restart the game.")


if __name__ == "__main__":
    main()
