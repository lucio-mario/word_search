// --- Core Logic Translation ---
class WordSearchGenerator {
    constructor(size) {
        this.size = size;
        this.grid = Array.from({ length: size }, () => Array(size).fill('-'));
        this.words = [];
        this.directions = [[0, 1], [1, 0], [1, 1]];
    }

    addWord(word) {
        word = word.toUpperCase();
        if (word.length > this.size) return false;

        let placed = false;
        let attempts = 0;
        const maxAttempts = 200;

        while (!placed && attempts < maxAttempts) {
            let dir = this.directions[Math.floor(Math.random() * this.directions.length)];
            let rowStart = Math.floor(Math.random() * this.size);
            let colStart = Math.floor(Math.random() * this.size);

            if (this._canPlaceWord(word, rowStart, colStart, dir)) {
                this._placeWord(word, rowStart, colStart, dir);
                this.words.push(word);
                placed = true;
            }
            attempts++;
        }
        return placed;
    }

    _canPlaceWord(word, row, col, dir) {
        let [dr, dc] = dir;
        for (let i = 0; i < word.length; i++) {
            let r = row + i * dr;
            let c = col + i * dc;
            if (r < 0 || r >= this.size || c < 0 || c >= this.size) return false;
            let currentChar = this.grid[r][c];
            if (currentChar !== '-' && currentChar !== word[i]) return false;
        }
        return true;
    }

    _placeWord(word, row, col, dir) {
        let [dr, dc] = dir;
        for (let i = 0; i < word.length; i++) {
            this.grid[row + i * dr][col + i * dc] = word[i];
        }
    }

    fillRandomLetters() {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === '-') {
                    this.grid[r][c] = letters.charAt(Math.floor(Math.random() * letters.length));
                }
            }
        }
    }
}

// --- App State & Data Management ---
// --- App State & Data Management ---
const defaultGames = {
    "Biofísica Clínica": {
        "size": 12,
        "grid": [
            ["F", "M", "C", "U", "P", "R", "O", "T", "E", "Ç", "Ã", "O"],
            ["F", "A", "Y", "É", "Z", "J", "O", "U", "Z", "Z", "C", "C"],
            ["M", "J", "C", "B", "R", "M", "U", "X", "M", "R", "M", "M"],
            ["I", "M", "U", "E", "Z", "E", "Á", "B", "E", "A", "G", "E"],
            ["L", "K", "D", "E", "L", "Z", "B", "S", "T", "D", "X", "T"],
            ["Í", "X", "H", "A", "O", "E", "A", "R", "C", "I", "Y", "Á"],
            ["M", "C", "N", "I", "H", "I", "R", "V", "O", "A", "J", "S"],
            ["E", "Â", "J", "P", "E", "L", "E", "A", "Q", "Ç", "R", "T"],
            ["T", "N", "P", "Z", "G", "P", "V", "U", "D", "Ã", "U", "A"],
            ["R", "C", "S", "É", "S", "I", "L", "V", "Q", "O", "G", "S"],
            ["O", "E", "N", "F", "A", "X", "X", "H", "W", "M", "R", "E"],
            ["T", "R", "T", "K", "A", "F", "D", "R", "J", "Q", "L", "F"]
        ],
        "words": [
            "CÂNCER", "RADIAÇÃO", "PROTEÇÃO", "PELE", "ACELERADOR", "MÁSCARA", "SÉSIL", "MILÍMETRO", "CÉREBRO", "METÁSTASE"
        ]
    }
};

const Storage = {
    load: () => {
        // Carrega os jogos do usuário da memória
        const userGames = JSON.parse(localStorage.getItem('wordSearchGames') || '{}');
        // Retorna uma união dos jogos padrão (imutáveis) com os jogos do usuário
        return { ...defaultGames, ...userGames };
    },
    save: (data) => {
        // Copia os dados para não alterar o original
        const dataToSave = { ...data };
        // Remove os jogos padrão da cópia antes de salvar na memória local
        Object.keys(defaultGames).forEach(name => delete dataToSave[name]);
        localStorage.setItem('wordSearchGames', JSON.stringify(dataToSave));
    }
};

const app = {
    switchFrame: (frameId) => {
        document.querySelectorAll('.frame').forEach(f => f.classList.remove('active'));
        document.getElementById(frameId).classList.add('active');
        if (frameId === 'select-frame') selectUI.refreshList();
        if (frameId === 'create-frame') createUI.reset();
    }
};

// --- Create Game Logic ---
const createUI = {
    words: [],
    reset: () => {
        createUI.words = [];
        document.getElementById('create-name').value = '';
        document.getElementById('create-size').value = '10';
        document.getElementById('create-word').value = '';
        document.getElementById('create-word-list').innerHTML = '';
    },
    addWord: () => {
        const input = document.getElementById('create-word');
        const word = input.value.trim().toUpperCase();
        const size = parseInt(document.getElementById('create-size').value);
        
        if (!word || isNaN(size) || size <= 0) return;
        if (word.length > size) {
            alert(`The word '${word}' cannot fit in a ${size}x${size} grid.`);
            return;
        }
        
        if (!createUI.words.includes(word)) {
            createUI.words.push(word);
            const li = document.createElement('li');
            li.textContent = "  " + word;
            document.getElementById('create-word-list').appendChild(li);
            input.value = '';
        }
    },
    generateAndSave: () => {
        const name = document.getElementById('create-name').value.trim();
        const size = parseInt(document.getElementById('create-size').value);
        
        if (!name) return alert("Please enter a Game Name.");
        if (!createUI.words.length) return alert("Please add at least one word.");

        const ws = new WordSearchGenerator(size);
        const wordsPlaced = [];
        const failedWords = [];

        createUI.words.forEach(word => {
            if (ws.addWord(word)) wordsPlaced.push(word);
            else failedWords.push(word);
        });

        if (failedWords.length) alert(`Could not place: ${failedWords.join(', ')}`);
        if (!wordsPlaced.length) return alert("Could not place any words.");

        ws.fillRandomLetters();

        const games = Storage.load();
        games[name] = { size: size, grid: ws.grid, words: wordsPlaced };
        Storage.save(games);

        alert(`Game '${name}' saved successfully!`);
        app.switchFrame('home-frame');
    }
};

// Allow 'Enter' key to add word
document.getElementById('create-word').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createUI.addWord();
});

// --- Select Game Logic ---
const selectUI = {
    selectedGame: null,
    refreshList: () => {
        const list = document.getElementById('select-game-list');
        list.innerHTML = '';
        const games = Storage.load();
        selectUI.selectedGame = null;

        Object.keys(games).forEach(name => {
            const li = document.createElement('li');
            li.textContent = "  " + name;
            li.onclick = () => {
                document.querySelectorAll('#select-game-list li').forEach(el => el.classList.remove('selected'));
                li.classList.add('selected');
                selectUI.selectedGame = name;
            };
            list.appendChild(li);
        });
    },
    deleteGame: () => {
        if (!selectUI.selectedGame) return alert("Select a game to delete.");

        // --- NOVA TRAVA DE SEGURANÇA ---
        if (defaultGames[selectUI.selectedGame]) {
            alert("You cannot delete the built-in default games.");
            return;
        }
        // -------------------------------

        if (confirm(`Delete '${selectUI.selectedGame}'?`)) {
            const games = Storage.load();
            delete games[selectUI.selectedGame];
            Storage.save(games);
            selectUI.refreshList();
        }
    },
    playGame: () => {
        if (!selectUI.selectedGame) return alert("Select a game first.");
        const data = Storage.load()[selectUI.selectedGame];
        playUI.loadGame(selectUI.selectedGame, data);
        app.switchFrame('play-frame');
    }
};

// --- Play Game Logic ---
const playUI = {
    size: 0, gridData: [], originalWords: [], wordsToFind: [],
    foundCells: new Set(), selectedCells: [], startCell: null,
    isDragging: false, isViewMode: false, hintActive: false, wordCoordsMap: {},

    loadGame: (name, data) => {
        playUI.size = data.size;
        playUI.gridData = data.grid;
        playUI.originalWords = [...data.words];
        playUI.wordsToFind = [...data.words];
        playUI.foundCells.clear();
        playUI.selectedCells = [];
        playUI.isViewMode = false;
        playUI.hintActive = false;
        
        document.getElementById('play-game-name').textContent = name;
        document.getElementById('btn-view').style.background = 'var(--btn-warn)';
        
        playUI.wordCoordsMap = playUI._mapAllWords();
        playUI.updateWordList();
        playUI.renderGrid();
    },

    _mapAllWords: () => {
        const map = {};
        const dirs = [[0, 1], [1, 0], [1, 1]];
        playUI.originalWords.forEach(word => {
            let found = false;
            for (let r = 0; r < playUI.size && !found; r++) {
                for (let c = 0; c < playUI.size && !found; c++) {
                    if (playUI.gridData[r][c] === word[0]) {
                        for (let [dr, dc] of dirs) {
                            let coords = [];
                            let valid = true;
                            for (let i = 0; i < word.length; i++) {
                                let nr = r + i * dr, nc = c + i * dc;
                                if (nr >= 0 && nr < playUI.size && nc >= 0 && nc < playUI.size && playUI.gridData[nr][nc] === word[i]) {
                                    coords.push(`${nr},${nc}`);
                                } else {
                                    valid = false; break;
                                }
                            }
                            if (valid) { map[word] = coords; found = true; break; }
                        }
                    }
                }
            }
        });
        return map;
    },

    renderGrid: () => {
        const container = document.getElementById('grid-container');
        container.style.gridTemplateColumns = `repeat(${playUI.size}, 30px)`;
        container.innerHTML = '';

        for (let r = 0; r < playUI.size; r++) {
            for (let c = 0; c < playUI.size; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = playUI.gridData[r][c];
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.id = `cell-${r}-${c}`;

                // Desktop Mouse Events
                cell.onmousedown = (e) => playUI.onDragStart(r, c, e);
                cell.onmouseenter = () => playUI.onDragMotion(r, c);
                cell.onmouseup = () => playUI.onDragRelease();

                // Mobile Touch Events
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault(); // Impede o clique duplo de dar zoom
                    playUI.onDragStart(r, c, { button: 0 }); // Simula clique esquerdo
                }, { passive: false });

                container.appendChild(cell);
            }
        }

        // Adiciona um listener global para capturar o movimento do dedo pela tela
        container.addEventListener('touchmove', playUI.onTouchMotion, { passive: false });
        container.addEventListener('touchend', playUI.onDragRelease);
    },

    updateWordList: () => {
        const list = document.getElementById('play-word-list');
        list.innerHTML = '';
        playUI.originalWords.forEach(word => {
            const li = document.createElement('li');
            li.textContent = "  " + word;
            if (!playUI.wordsToFind.includes(word)) li.classList.add('found');
            list.appendChild(li);
        });
    },

    onDragStart: (r, c, e) => {
        if (playUI.isViewMode || e.button !== 0) return; // Only left click
        playUI.isDragging = true;
        playUI.startCell = { r, c };
        playUI.updateDragSelection(r, c);
    },

    onDragMotion: (r, c) => {
        if (!playUI.isDragging || playUI.isViewMode) return;
        playUI.updateDragSelection(r, c);
    },

    onTouchMotion: (e) => {
        e.preventDefault(); // Impede scroll
        if (!playUI.isDragging || playUI.isViewMode) return;

        // Pega as coordenadas X e Y do primeiro dedo tocando a tela
        const touch = e.touches[0];
        // Descobre qual elemento HTML está exatamente debaixo do dedo
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        // Se o dedo estiver sobre uma célula da grade, extrai o R e C e atualiza
        if (target && target.classList.contains('cell')) {
            const r = parseInt(target.dataset.r);
            const c = parseInt(target.dataset.c);
            playUI.updateDragSelection(r, c);
        }
    },

    onDragRelease: () => {
        if (playUI.isDragging) {
            playUI.isDragging = false;
            playUI.verifySelection();
        }
    },

    updateDragSelection: (endR, endC) => {
        const { r: startR, c: startC } = playUI.startCell;
        const dr = endR - startR;
        const dc = endC - startC;

        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
            playUI.clearCurrentSelectionColors();
            const stepR = dr === 0 ? 0 : (dr > 0 ? 1 : -1);
            const stepC = dc === 0 ? 0 : (dc > 0 ? 1 : -1);
            const length = Math.max(Math.abs(dr), Math.abs(dc));

            playUI.selectedCells = [];
            for (let i = 0; i <= length; i++) {
                const r = startR + i * stepR;
                const c = startC + i * stepC;
                playUI.selectedCells.push(`${r},${c}`);
                const cellObj = document.getElementById(`cell-${r}-${c}`);
                if (!cellObj.classList.contains('hint')) cellObj.classList.add('selected');
            }
        }
    },

    clearCurrentSelectionColors: () => {
        playUI.selectedCells.forEach(coord => {
            const cellObj = document.getElementById(`cell-${coord.replace(',', '-')}`);
            cellObj.classList.remove('selected');
        });
    },

    verifySelection: () => {
        if (!playUI.selectedCells.length) return;

        let selectedWord = playUI.selectedCells.map(coord => {
            const [r, c] = coord.split(',');
            return playUI.gridData[r][c];
        }).join('');
        
        let reversedWord = selectedWord.split('').reverse().join('');
        let foundWord = null;

        if (playUI.wordsToFind.includes(selectedWord)) foundWord = selectedWord;
        else if (playUI.wordsToFind.includes(reversedWord)) foundWord = reversedWord;

        if (foundWord) {
            playUI.wordsToFind = playUI.wordsToFind.filter(w => w !== foundWord);
            playUI.selectedCells.forEach(coord => {
                playUI.foundCells.add(coord);
                document.getElementById(`cell-${coord.replace(',', '-')}`).classList.add('found');
            });
            playUI.updateWordList();
            
            // Check win condition
            setTimeout(() => {
               if (playUI.wordsToFind.length === 0) alert("Congratulations! You found all the words!");
            }, 100);
            
        } else {
            playUI.clearCurrentSelectionColors();
        }
        playUI.selectedCells = [];
    },

    triggerHint: () => {
        if (playUI.isViewMode || playUI.wordsToFind.length === 0 || playUI.hintActive) return;
        playUI.hintActive = true;
        
        const word = playUI.wordsToFind[Math.floor(Math.random() * playUI.wordsToFind.length)];
        const coords = playUI.wordCoordsMap[word] || [];
        
        coords.forEach(coord => {
            if (!playUI.foundCells.has(coord)) {
                document.getElementById(`cell-${coord.replace(',', '-')}`).classList.add('hint');
            }
        });

        setTimeout(() => {
            playUI.hintActive = false;
            coords.forEach(coord => {
                document.getElementById(`cell-${coord.replace(',', '-')}`).classList.remove('hint');
            });
        }, 1500);
    },

    toggleSolution: () => {
        playUI.isViewMode = !playUI.isViewMode;
        const btn = document.getElementById('btn-view');
        
        if (playUI.isViewMode) {
            btn.style.background = 'var(--entry-bg)';
            Object.values(playUI.wordCoordsMap).forEach(coords => {
                coords.forEach(coord => {
                    document.getElementById(`cell-${coord.replace(',', '-')}`).classList.add('view');
                });
            });
        } else {
            btn.style.background = 'var(--btn-warn)';
            document.querySelectorAll('.cell.view').forEach(cell => cell.classList.remove('view'));
        }
    }
};
