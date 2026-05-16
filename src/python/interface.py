import sys
import tkinter as tk
from tkinter import messagebox
import json
import os
import random
from word_search import WordSearchGenerator

SAVE_FILE = "saved_games.json"

# --- Color Palette (Dark Theme) ---
BG_MAIN = "#1e1e1e"
BG_SIDEBAR = "#252526"
FG_TEXT = "#ffffff"
FG_SUBTEXT = "#aaaaaa"
ENTRY_BG = "#3c3c3c"
ENTRY_FG = "#ffffff"

BTN_PRIMARY = "#1f5f99"
BTN_PRIMARY_ACT = "#2a7bbd"
BTN_SUCCESS = "#2ebd59"
BTN_SUCCESS_ACT = "#36d968"
BTN_HINT = "#8e44ad"
BTN_HINT_ACT = "#9b59b6"
BTN_WARN = "#d35400"
BTN_WARN_ACT = "#e67e22"
BTN_DANGER = "#c0392b"
BTN_DANGER_ACT = "#d64b3f"

CELL_BG = "#333333"
CELL_FG = "#ffffff"
CELL_SEL = "#f1c40f"
CELL_FOUND = "#2ebd59"
CELL_HINT = "#9b59b6"
CELL_VIEW = "#e67e22"

# --- Global Styles ---
FONT_TITLE = ("Arial", 18, "bold")
FONT_SUBTITLE = ("Arial", 12, "bold")
FONT_NORMAL = ("Arial", 11)
FONT_GRID = ("Courier", 14, "bold")

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        # Fallback to current working directory
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

def load_saved_games():
    if os.path.exists(SAVE_FILE):
        try:
            with open(SAVE_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}

def save_games_data(data):
    with open(SAVE_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def create_button(parent, text, command, color, active_color, width=None, font=FONT_NORMAL):
    btn = tk.Button(parent, text=text, command=command, bg=color, fg=FG_TEXT,
                    activebackground=active_color, activeforeground=FG_TEXT,
                    relief="flat", borderwidth=0, cursor="hand2", font=font)
    if width:
        btn.config(width=width)
    return btn

def create_entry(parent, width=20):
    entry = tk.Entry(parent, width=width, bg=ENTRY_BG, fg=ENTRY_FG,
                     insertbackground=FG_TEXT, relief="flat", font=FONT_NORMAL)
    return entry

class HomeFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master, bg=BG_MAIN)

        container = tk.Frame(self, bg=BG_MAIN)
        container.place(relx=0.5, rely=0.5, anchor=tk.CENTER)

        tk.Label(container, text="Word Search Generator", font=("Arial", 28, "bold"), bg=BG_MAIN, fg=FG_TEXT).pack(pady=(0, 40))

        btn_create = create_button(container, "Create New Game", lambda: master.switch_frame(CreateGameFrame), BTN_PRIMARY, BTN_PRIMARY_ACT, width=25, font=FONT_SUBTITLE)
        btn_create.pack(pady=10, ipady=8)

        btn_play = create_button(container, "Play Saved Game", lambda: master.switch_frame(SelectGameFrame), BTN_SUCCESS, BTN_SUCCESS_ACT, width=25, font=FONT_SUBTITLE)
        btn_play.pack(pady=10, ipady=8)

class CreateGameFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master, bg=BG_MAIN)
        self.words = []

        self.sidebar = tk.Frame(self, bg=BG_SIDEBAR, width=300)
        self.sidebar.pack(side=tk.LEFT, fill=tk.Y)
        self.sidebar.pack_propagate(False)

        tk.Label(self.sidebar, text="Game Setup", font=FONT_TITLE, bg=BG_SIDEBAR, fg=FG_TEXT).pack(pady=(30, 20))

        form_frame = tk.Frame(self.sidebar, bg=BG_SIDEBAR)
        form_frame.pack(padx=20, fill=tk.X)

        tk.Label(form_frame, text="Game Name", font=FONT_NORMAL, bg=BG_SIDEBAR, fg=FG_SUBTEXT).pack(anchor='w')
        self.name_entry = create_entry(form_frame, width=30)
        self.name_entry.pack(fill=tk.X, pady=(0, 15), ipady=5)

        tk.Label(form_frame, text="Grid Size", font=FONT_NORMAL, bg=BG_SIDEBAR, fg=FG_SUBTEXT).pack(anchor='w')
        self.size_entry = create_entry(form_frame, width=30)
        self.size_entry.insert(0, "10")
        self.size_entry.pack(fill=tk.X, pady=(0, 15), ipady=5)

        tk.Label(form_frame, text="Add Word", font=FONT_NORMAL, bg=BG_SIDEBAR, fg=FG_SUBTEXT).pack(anchor='w')

        word_input_frame = tk.Frame(form_frame, bg=BG_SIDEBAR)
        word_input_frame.pack(fill=tk.X, pady=(0, 20))

        self.word_entry = create_entry(word_input_frame, width=20)
        self.word_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=5)
        self.word_entry.bind('<Return>', lambda event: self.add_word())

        btn_add = create_button(word_input_frame, "Add", self.add_word, BTN_PRIMARY, BTN_PRIMARY_ACT)
        btn_add.pack(side=tk.RIGHT, padx=(5, 0), ipady=3, ipadx=5)

        bottom_frame = tk.Frame(self.sidebar, bg=BG_SIDEBAR)
        bottom_frame.pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=30)

        btn_save = create_button(bottom_frame, "Generate & Save", self.generate_and_save, BTN_SUCCESS, BTN_SUCCESS_ACT, font=FONT_SUBTITLE)
        btn_save.pack(fill=tk.X, pady=(0, 10), ipady=8)

        btn_back = create_button(bottom_frame, "Back to Home", lambda: master.switch_frame(HomeFrame), ENTRY_BG, FG_SUBTEXT)
        btn_back.pack(fill=tk.X, ipady=5)

        self.main_area = tk.Frame(self, bg=BG_MAIN)
        self.main_area.pack(side=tk.RIGHT, expand=True, fill=tk.BOTH, padx=40, pady=40)

        tk.Label(self.main_area, text="Words to hide:", font=FONT_TITLE, bg=BG_MAIN, fg=FG_TEXT).pack(anchor='w', pady=(0, 10))

        self.listbox = tk.Listbox(self.main_area, bg=ENTRY_BG, fg=FG_TEXT, font=FONT_NORMAL,
                                  relief="flat", highlightthickness=0, selectbackground=BTN_PRIMARY)
        self.listbox.pack(expand=True, fill=tk.BOTH)

    def add_word(self):
        word = self.word_entry.get().strip().upper()
        if not word: return

        try:
            size = int(self.size_entry.get())
            if size <= 0: raise ValueError
        except ValueError:
            messagebox.showerror("Error", "Please set a valid Grid Size before adding words.")
            return

        if len(word) > size:
            messagebox.showerror("Word Too Long", f"The word '{word}' ({len(word)} letters) cannot fit in a {size}x{size} grid.")
            return

        if word not in self.words:
            self.words.append(word)
            self.listbox.insert(tk.END, "  " + word)
            self.word_entry.delete(0, tk.END)

    def generate_and_save(self):
        game_name = self.name_entry.get().strip()
        if not game_name:
            messagebox.showerror("Error", "Please enter a Game Name.")
            return

        try:
            size = int(self.size_entry.get())
            if size <= 0: raise ValueError
        except ValueError:
            messagebox.showerror("Error", "Grid size must be a positive integer.")
            return

        if not self.words:
            messagebox.showwarning("Warning", "Please add at least one word.")
            return

        ws = WordSearchGenerator(size)
        failed_words = []
        words_placed = []

        for word in self.words:
            if ws.add_word(word):
                words_placed.append(word)
            else:
                failed_words.append(word)

        if failed_words:
            messagebox.showwarning("Placement Issue", f"Could not place: {', '.join(failed_words)}\nThey will be ignored.")

        if not words_placed:
            messagebox.showerror("Error", "Could not place any words. Try a larger grid.")
            return

        ws.fill_random_letters()

        games = load_saved_games()
        games[game_name] = {
            "size": size,
            "grid": ws.grid,
            "words": words_placed
        }
        save_games_data(games)

        messagebox.showinfo("Success", f"Game '{game_name}' saved successfully!")
        self.master.switch_frame(HomeFrame)

class SelectGameFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master, bg=BG_MAIN)

        container = tk.Frame(self, bg=BG_MAIN)
        container.place(relx=0.5, rely=0.5, anchor=tk.CENTER)

        tk.Label(container, text="Select a Game", font=FONT_TITLE, bg=BG_MAIN, fg=FG_TEXT).pack(pady=(0, 20))

        self.games_data = load_saved_games()

        self.listbox = tk.Listbox(container, height=12, width=40, font=FONT_NORMAL,
                                  bg=ENTRY_BG, fg=FG_TEXT, relief="flat", highlightthickness=0,
                                  selectbackground=BTN_PRIMARY)
        self.listbox.pack(pady=10)

        self._refresh_listbox()

        btn_frame = tk.Frame(container, bg=BG_MAIN)
        btn_frame.pack(pady=20, fill=tk.X)

        btn_back = create_button(btn_frame, "Back", lambda: master.switch_frame(HomeFrame), ENTRY_BG, FG_SUBTEXT, width=10)
        btn_back.pack(side=tk.LEFT, ipady=5)

        btn_play = create_button(btn_frame, "Play", self.play_game, BTN_SUCCESS, BTN_SUCCESS_ACT, width=10)
        btn_play.pack(side=tk.RIGHT, ipady=5)

        btn_delete = create_button(btn_frame, "Delete", self.delete_game, BTN_DANGER, BTN_DANGER_ACT, width=10)
        btn_delete.pack(side=tk.RIGHT, padx=10, ipady=5)

    def _refresh_listbox(self):
        self.listbox.delete(0, tk.END)
        for name in self.games_data.keys():
            self.listbox.insert(tk.END, "  " + name)

    def delete_game(self):
        selection = self.listbox.curselection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a game to delete.")
            return

        game_name = self.listbox.get(selection[0]).strip()

        confirm = messagebox.askyesno("Confirm Delete", f"Are you sure you want to delete the game '{game_name}'?")
        if confirm:
            del self.games_data[game_name]
            save_games_data(self.games_data)
            self._refresh_listbox()

    def play_game(self):
        selection = self.listbox.curselection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a game first.")
            return

        game_name = self.listbox.get(selection[0]).strip()
        game_data = self.games_data[game_name]
        self.master.switch_frame(PlayGameFrame, game_name, game_data)

class PlayGameFrame(tk.Frame):
    def __init__(self, master, game_name, game_data):
        super().__init__(master, bg=BG_MAIN)

        self.game_name = game_name
        self.size = game_data["size"]
        self.grid_letters = game_data["grid"]
        self.original_words = game_data["words"]

        self.words_to_find = list(self.original_words)
        self.found_cells = set()

        self.buttons_grid = {}
        self.widget_to_coords = {}
        self.is_dragging = False
        self.start_cell = None
        self.selected_cells = []

        self.is_view_mode = False
        self.hint_active = False
        self.word_coords_map = self._map_all_words_in_grid()

        self.sidebar = tk.Frame(self, bg=BG_SIDEBAR, width=250)
        self.sidebar.pack(side=tk.LEFT, fill=tk.Y)
        self.sidebar.pack_propagate(False)

        tk.Label(self.sidebar, text=self.game_name, font=FONT_TITLE, bg=BG_SIDEBAR, fg=FG_TEXT, wraplength=230).pack(pady=(20, 10))
        tk.Label(self.sidebar, text="Words to find:", font=FONT_SUBTITLE, bg=BG_SIDEBAR, fg=FG_SUBTEXT).pack(anchor='w', padx=20, pady=(5, 5))

        self.listbox = tk.Listbox(self.sidebar, bg=BG_SIDEBAR, fg=FG_TEXT, font=FONT_NORMAL,
                                  relief="flat", highlightthickness=0, selectbackground=BG_SIDEBAR)
        self.listbox.pack(fill=tk.BOTH, expand=True, padx=20)
        self.update_listbox_colors()

        action_frame = tk.Frame(self.sidebar, bg=BG_SIDEBAR)
        action_frame.pack(fill=tk.X, padx=20, pady=(10, 0))

        self.btn_hint = create_button(action_frame, "Show Hint", self.trigger_hint, BTN_HINT, BTN_HINT_ACT)
        self.btn_hint.pack(fill=tk.X, pady=5, ipady=6)

        self.btn_view = create_button(action_frame, "Toggle Solution", self.toggle_solution, BTN_WARN, BTN_WARN_ACT)
        self.btn_view.pack(fill=tk.X, pady=5, ipady=6)

        bottom_frame = tk.Frame(self.sidebar, bg=BG_SIDEBAR)
        bottom_frame.pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=20)

        tk.Label(bottom_frame, text="Click and drag to select", bg=BG_SIDEBAR, fg=FG_SUBTEXT, font=("Arial", 10)).pack(pady=(0, 15))
        btn_back = create_button(bottom_frame, "Exit Game", lambda: master.switch_frame(HomeFrame), ENTRY_BG, FG_SUBTEXT)
        btn_back.pack(fill=tk.X, ipady=8)

        self.main_area = tk.Frame(self, bg=BG_MAIN)
        self.main_area.pack(side=tk.RIGHT, expand=True, fill=tk.BOTH)

        self.grid_container = tk.Frame(self.main_area, bg=BG_MAIN)
        self.grid_container.place(relx=0.5, rely=0.5, anchor=tk.CENTER)

        self.render_grid()

    def _map_all_words_in_grid(self):
        coords_map = {}
        # Strict mapping: only Left->Right, Top->Bottom, and Top-Left->Bottom-Right
        directions = [(0, 1), (1, 0), (1, 1)]

        for word in self.original_words:
            found = False
            for r in range(self.size):
                for c in range(self.size):
                    if self.grid_letters[r][c] == word[0] and not found:
                        for dr, dc in directions:
                            coords = []
                            valid = True
                            for i, letter in enumerate(word):
                                nr, nc = r + i * dr, c + i * dc
                                if 0 <= nr < self.size and 0 <= nc < self.size and self.grid_letters[nr][nc] == letter:
                                    coords.append((nr, nc))
                                else:
                                    valid = False
                                    break
                            if valid:
                                coords_map[word] = coords
                                found = True
                                break
                if found: break
        return coords_map

    def trigger_hint(self):
        if self.is_view_mode or not self.words_to_find or self.hint_active:
            return

        self.hint_active = True
        word = random.choice(self.words_to_find)
        coords = self.word_coords_map.get(word, [])

        for r, c in coords:
            if (r, c) not in self.found_cells:
                self.buttons_grid[(r, c)].config(bg=CELL_HINT, fg=FG_TEXT)

        self.after(1500, self._remove_hint, coords)

    def _remove_hint(self, coords):
        self.hint_active = False
        if self.is_view_mode: return

        for r, c in coords:
            if (r, c) in self.found_cells:
                self.buttons_grid[(r, c)].config(bg=CELL_FOUND, fg=FG_TEXT)
            elif (r, c) in self.selected_cells:
                self.buttons_grid[(r, c)].config(bg=CELL_SEL, fg="#000000")
            else:
                self.buttons_grid[(r, c)].config(bg=CELL_BG, fg=CELL_FG)

    def toggle_solution(self):
        self.is_view_mode = not self.is_view_mode

        if self.is_view_mode:
            self.btn_view.config(bg=ENTRY_BG)
            for word, coords in self.word_coords_map.items():
                for r, c in coords:
                    self.buttons_grid[(r, c)].config(bg=CELL_VIEW, fg=FG_TEXT)
        else:
            self.btn_view.config(bg=BTN_WARN)
            for r in range(self.size):
                for c in range(self.size):
                    if (r, c) in self.found_cells:
                        self.buttons_grid[(r, c)].config(bg=CELL_FOUND, fg=FG_TEXT)
                    else:
                        self.buttons_grid[(r, c)].config(bg=CELL_BG, fg=CELL_FG)

    def render_grid(self):
        for r in range(self.size):
            for c in range(self.size):
                letter = self.grid_letters[r][c]
                lbl = tk.Label(self.grid_container, text=letter, width=2, height=1,
                               font=FONT_GRID, bg=CELL_BG, fg=CELL_FG, relief="flat", cursor="crosshair")
                lbl.grid(row=r, column=c, padx=2, pady=2)

                lbl.bind("<Button-1>", lambda e, row=r, col=c: self.on_drag_start(e, row, col))
                lbl.bind("<B1-Motion>", self.on_drag_motion)
                lbl.bind("<ButtonRelease-1>", self.on_drag_release)

                self.buttons_grid[(r, c)] = lbl
                self.widget_to_coords[lbl] = (r, c)

    def on_drag_start(self, event, r, c):
        if self.is_view_mode: return
        self.is_dragging = True
        self.start_cell = (r, c)
        self.update_drag_selection(r, c)

    def on_drag_motion(self, event):
        if not self.is_dragging or self.is_view_mode: return
        widget = self.winfo_containing(event.x_root, event.y_root)
        if widget in self.widget_to_coords:
            r, c = self.widget_to_coords[widget]
            self.update_drag_selection(r, c)

    def on_drag_release(self, event):
        if self.is_dragging:
            self.is_dragging = False
            self.verify_selection()

    def update_drag_selection(self, end_r, end_c):
        start_r, start_c = self.start_cell
        dr = end_r - start_r
        dc = end_c - start_c

        if dr == 0 or dc == 0 or abs(dr) == abs(dc):
            self.clear_current_selection_colors()
            step_r = 0 if dr == 0 else (1 if dr > 0 else -1)
            step_c = 0 if dc == 0 else (1 if dc > 0 else -1)
            length = max(abs(dr), abs(dc))

            self.selected_cells = []
            for i in range(length + 1):
                cell = (start_r + i * step_r, start_c + i * step_c)
                self.selected_cells.append(cell)
                if self.buttons_grid[cell].cget("bg") != CELL_HINT:
                    self.buttons_grid[cell].config(bg=CELL_SEL, fg="#000000")

    def clear_current_selection_colors(self):
        for r, c in self.selected_cells:
            if self.buttons_grid[(r, c)].cget("bg") == CELL_HINT:
                continue
            elif (r, c) in self.found_cells:
                self.buttons_grid[(r, c)].config(bg=CELL_FOUND, fg=FG_TEXT)
            else:
                self.buttons_grid[(r, c)].config(bg=CELL_BG, fg=CELL_FG)

    def verify_selection(self):
        if not self.selected_cells: return

        selected_word = "".join([self.grid_letters[r][c] for r, c in self.selected_cells])
        reversed_word = selected_word[::-1]

        found_word = None
        if selected_word in self.words_to_find: found_word = selected_word
        elif reversed_word in self.words_to_find: found_word = reversed_word

        if found_word:
            self.words_to_find.remove(found_word)
            for r, c in self.selected_cells:
                self.found_cells.add((r, c))
                self.buttons_grid[(r, c)].config(bg=CELL_FOUND, fg=FG_TEXT)
            self.update_listbox_colors()

            if not self.words_to_find:
                messagebox.showinfo("Congratulations!", "You found all the words!")
        else:
            self.clear_current_selection_colors()

        self.selected_cells.clear()

    def update_listbox_colors(self):
        self.listbox.delete(0, tk.END)
        for word in self.original_words:
            self.listbox.insert(tk.END, "  " + word)
            idx = self.listbox.size() - 1
            if word not in self.words_to_find:
                self.listbox.itemconfig(idx, {'fg': '#555555'})
            else:
                self.listbox.itemconfig(idx, {'fg': FG_TEXT})

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Word Search Application")
        self.geometry("900x650")
        self.configure(bg=BG_MAIN)

        # --- Add Icon Logic Here ---
        try:
            if sys.platform.startswith('win'):
                # Windows uses .ico
                icon_path = resource_path(os.path.join("assets", "icon.ico"))
                self.iconbitmap(icon_path)
            else:
                # Linux/macOS uses PhotoImage (.png)
                icon_path = resource_path(os.path.join("assets", "icon.png"))
                icon_img = tk.PhotoImage(file=icon_path)
                self.wm_iconphoto(True, icon_img)
        except Exception as e:
            print(f"Warning: Could not load application icon: {e}")
        # ---------------------------

        self.current_frame = None
        self.switch_frame(HomeFrame)

    def switch_frame(self, frame_class, *args):
        """Destroys current frame and replaces it with a new one."""
        if self.current_frame is not None:
            self.current_frame.destroy()
        self.current_frame = frame_class(self, *args)
        self.current_frame.pack(fill="both", expand=True)

if __name__ == "__main__":
    app = App()
    app.mainloop()
