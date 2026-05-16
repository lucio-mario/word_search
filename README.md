# Word Search Generator & Player

The **Word Search Generator** is a cross-platform application that allows users to create custom word search puzzles, save them, and play them interactively with drag-and-drop mechanics, visual hints, and a sleek dark-mode interface.

It is available as a **Desktop Application** (built in Python/`tkinter`) and as a **Web Game** (built in `HTML`/`JS`).

![Interface Photo](assets/interface.png)

## Table of Contents

- [About the Project](#about-the-project)
  - [Features](#features)
  - [Repository Structure](#repository-structure)
- [How to Play](#how-to-play)
  - [Play Online (Web Version)](#play-online-web-version)
  - [Download the Executable (Releases)](#download-the-executable-releases)
  - [Running from Source (Python)](#running-from-source-python)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [License](#license)
- [Author](#author)

## About the Project

This tool was designed to be lightweight and dependency-free. The core logic handles smart grid generation and game state, running natively on Desktop via Python or directly in the Browser via Javascript.

### Features

* **Interactive Gameplay:** Click and drag across the grid to select words.
* **Smart Grid Generation:** Automatically places words horizontally, vertically, and diagonally (left-to-right) with random intersections.
* **Game Management:** Save custom grids and word lists locally (via JSON or LocalStorage). Play them later from the main menu.
* **Assistive Tools:**
    * **Show Hint:** Flashes the location of a missing word in purple.
    * **Toggle Solution:** Temporarily reveals all hidden words in orange.
* **Modern UI:** Custom flat-design dark mode.

([back to top](#table-of-contents))

### Repository Structure

- [`src/python/`](./src/python/): Core Python source code (`interface.py`, `word_search.py`).
- [`src/web/`](./src/web/): Web version source code (HTML, CSS, JS).
- [`assets/`](./assets/): Icons and static resources (screenshots).
- `saved_games.json`: Local storage file generated at runtime by the Python app (ignored in version control).

([back to top](#table-of-contents))

## How to Play

### Play Online (Web Version)
The easiest way to play is directly in your browser. No installation required!

👉 **[Click here to play Word Search Online](https://lucio-mario.github.io/word_search/)**

### Download the Executable (Releases)
If you prefer the standalone Desktop version without needing to install Python:

1. Navigate to the **[Releases page](https://github.com/lucio-mario/word_search/releases)** on this repository.
2. Download the appropriate file for your OS (`WordSearch_Windows.exe` or `WordSearch_Linux`).
3. Run the downloaded file.
*(Linux users may need to grant execution permissions: `chmod +x WordSearch_Linux`)*.

### Running from Source (Python)

Because the Python application uses the standard library, no external packages are required to run the core game. You only need Python 3.8+ and `tkinter` (Linux users might need to install it via their package manager, e.g., `sudo pacman -S tk`).

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/lucio-mario/word_search.git](https://github.com/lucio-mario/word_search.git)
    cd word_search
    ```

2.  **Run the application (Always run from the project root):**
    ```bash
    python src/python/interface.py
    ```

*(Optional)* If you wish to build the executable yourself using PyInstaller:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pyinstaller --noconsole --onefile --name WordSearch --icon assets/icon.png --add-data "assets:assets" src/python/interface.py
```

([back to top](#table-of-contents))

## Usage

1. Launch the application or the Web page.
2. Create New Game:
* Enter a Game Name and grid size.
* Type words and press Enter (or click Add).
* Click Generate & Save.
3. Play Saved Game:
* Select a previously created game from the list.
* Click and drag across the letters on the grid to form words.
* Use "Show Hint" or "Toggle Solution" if you get stuck.

([back to top](#table-of-contents))

## Tech Stack

* **Language**: `Python` & `JavaScript`

* **GUI Framework**: `tkinter` (Standard Library)

* Web UI: Vanilla `HTML`/`CSS`

* **Data Storage**: `json` (Standard Library)/`LocalStorage` (Web)

([back to top](#table-of-contents))

## License

This project is released under the **MIT License**.
See the [`LICENSE`](./LICENSE) file for details.

([back to top](#table-of-contents))

## Author

Developed by **Lúcio Mário Barbosa da Silva Filho**
GitHub: [`@lucio-mario`](https://github.com/lucio-mario)

([back to top](#table-of-contents))
