import random
import string

class WordSearchGenerator:
    def __init__(self, size):
        self.size = size
        self.grid = [['-' for _ in range(size)] for _ in range(size)]
        self.words = []

        # Strict forward-reading: Left->Right, Top->Bottom, and Top-Left->Bottom-Right
        self.directions = [
            (0, 1),   # Horizontal Right (Left to Right)
            (1, 0),   # Vertical Down (Top to Bottom)
            (1, 1)    # Diagonal Down-Right (Top-Left to Bottom-Right)
        ]

    def add_word(self, word):
        word = word.upper()

        # Prevent placing words larger than the grid
        if len(word) > self.size:
            print(f"[!] Error: The word '{word}' is too long for a {self.size}x{self.size} grid.")
            return False

        placed = False
        attempts = 0
        max_attempts = 200

        while not placed and attempts < max_attempts:
            direction = random.choice(self.directions)
            dr, dc = direction

            # SMART BOUNDARIES: Calculate the maximum valid starting index for this specific direction
            max_row = self.size - (len(word) if dr == 1 else 1)
            max_col = self.size - (len(word) if dc == 1 else 1)

            # Skip if mathematically impossible to fit (failsafe)
            if max_row < 0 or max_col < 0:
                attempts += 1
                continue

            # Pick random coordinates ONLY within the safe zone
            row_start = random.randint(0, max_row)
            col_start = random.randint(0, max_col)

            # Now _can_place_word only needs to worry about letter collisions, not boundaries!
            if self._can_place_word(word, row_start, col_start, direction):
                self._place_word(word, row_start, col_start, direction)
                self.words.append(word)
                placed = True

            attempts += 1

        if not placed:
            print(f"[!] Warning: Could not place the word '{word}' after {max_attempts} attempts. Grid might be full.")
            return False
        return True

    def _can_place_word(self, word, row, col, direction):
        dr, dc = direction
        for i, letter in enumerate(word):
            r = row + i * dr
            c = col + i * dc

            # Check if the coordinates are out of bounds
            if r < 0 or r >= self.size or c < 0 or c >= self.size:
                return False

            # Check for collisions: allow overlap only if the letters match
            current_char = self.grid[r][c]
            if current_char != '-' and current_char != letter:
                return False

        return True

    def _place_word(self, word, row, col, direction):
        dr, dc = direction
        for i, letter in enumerate(word):
            r = row + i * dr
            c = col + i * dc
            self.grid[r][c] = letter

    def fill_random_letters(self):
        # Fill all remaining empty slots ('-') with random uppercase letters
        for r in range(self.size):
            for c in range(self.size):
                if self.grid[r][c] == '-':
                    self.grid[r][c] = random.choice(string.ascii_uppercase)

    def print_grid(self):
        print("\n" + "="*30)
        print("        WORD SEARCH")
        print("="*30 + "\n")

        for row in self.grid:
            print(" ".join(row))

        print("\n" + "-"*30)
        print("Words to find:")
        print(" | ".join(self.words))
        print("-"*30 + "\n")


if __name__ == "__main__":
    try:
        grid_size = int(input("Enter grid size (e.g., 10 for a 10x10 grid): "))
        if grid_size <= 0:
            raise ValueError

        ws = WordSearchGenerator(grid_size)

        print("\n--- Word Input ---")
        print("Type your words one by one.")
        print("Type 'q' or 'quit' when you are done.\n")

        while True:
            word_input = input("Enter a word to hide: ").strip()
            if word_input.lower() in ['q', 'quit']:
                break
            if word_input:
                ws.add_word(word_input)

        ws.fill_random_letters()
        ws.print_grid()

    except ValueError:
        print("[!] Error: Please enter a valid positive integer for the grid size.")
    except KeyboardInterrupt:
        print("\nProgram terminated.")
