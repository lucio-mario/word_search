# Word Search Generator & Player

The **Word Search Generator** is a desktop application built in Python using `tkinter`. It allows users to create custom word search puzzles, save them, and play them interactively with drag-and-drop mechanics, visual hints, and a dark-mode interface.

![Interface Photo](assets/interface.png)

## Table of Contents

- [About the Project](#about-the-project)
  - [Features](#features)
  - [Repository Structure](#repository-structure)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Running from Source](#running-from-source)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [License](#license)
- [Author](#author)

## About the Project

This tool was designed to be a lightweight, dependency-free interactive game. All graphics and mechanics are rendered using the standard Python GUI library.

### Features

* **Interactive Gameplay:** Click and drag across the grid to select words.
* **Smart Grid Generation:** Automatically places words horizontally, vertically, and diagonally (left-to-right) with random intersections.
* **Game Management:** Save custom grids and word lists locally using JSON. Play them later from the main menu.
* **Assistive Tools:**
    * **Show Hint:** Flashes the location of a missing word in purple.
    * **Toggle Solution:** Temporarily reveals all hidden words in orange.
* **Modern UI:** Custom flat-design dark mode using standard `tkinter` widgets.

([back to top](#table-of-contents))

### Repository Structure

- [`src/`](./src/): Core Python source code (`interface.py`, `word_search.py`).
- [`assets/`](./assets/): Icons and static resources (screenshots).
- `saved_games.json`: Local storage file generated at runtime (ignored in version control).

([back to top](#table-of-contents))

## Installation

### Prerequisites

Because this project uses Python's standard library, no external packages are required to run the core application. You only need:
* Python 3.8 or higher.
* `tkinter` (Usually included with Python, but Linux users might need to install it via their package manager, e.g., `sudo pacman -S tk`).

### Running from Source

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/lucio-mario/word_search.git](https://github.com/lucio-mario/word_search.git)
    cd word_search
    ```

2.  **Run the application:**
    ```bash
    python src/interface.py
    ```

*(Optional)* If you wish to build an executable later, you can install the build dependencies in a virtual environment:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

([back to top](#table-of-contents))

## Usage

1. Launch the application.
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

* **Language**: `Python`

* **GUI Framework**: `tkinter` (Standard Library)

* **Data Storage**: `json` (Standard Library)

([back to top](#table-of-contents))

## License

This project is released under the **MIT License**.
See the [`LICENSE`](./LICENSE) file for details.

([back to top](#table-of-contents))

## Author

Developed by **Lúcio Mário Barbosa da Silva Filho**
GitHub: [`@lucio-mario`](https://github.com/lucio-mario)

([back to top](#table-of-contents))
