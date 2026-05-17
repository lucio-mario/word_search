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
            let [dr, dc] = dir;

            let maxRow = this.size - (dr === 1 ? word.length : 1);
            let maxCol = this.size - (dc === 1 ? word.length : 1);

            if (maxRow < 0 || maxCol < 0) { attempts++; continue; }

            let rowStart = Math.floor(Math.random() * (maxRow + 1));
            let colStart = Math.floor(Math.random() * (maxCol + 1));

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
            let r = row + i * dr, c = col + i * dc;
            if (r < 0 || r >= this.size || c < 0 || c >= this.size) return false;
            if (this.grid[r][c] !== '-' && this.grid[r][c] !== word[i]) return false;
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
        "words": ["CÂNCER", "RADIAÇÃO", "PROTEÇÃO", "PELE", "ACELERADOR", "MÁSCARA", "SÉSIL", "MILÍMETRO", "CÉREBRO", "METÁSTASE"]
    }
};

const Storage = {
    load: () => {
        const userGames = JSON.parse(localStorage.getItem('wordSearchGames') || '{}');
        return { ...defaultGames, ...userGames };
    },
    save: (data) => {
        const dataToSave = { ...data };
        Object.keys(defaultGames).forEach(name => delete dataToSave[name]);
        localStorage.setItem('wordSearchGames', JSON.stringify(dataToSave));
    }
};

const app = {
    isMultiplayer: false,
    switchFrame: (frameId) => {
        document.querySelectorAll('.frame').forEach(f => f.classList.remove('active'));
        document.getElementById(frameId).classList.add('active');
        if (frameId === 'select-frame') selectUI.refreshList();
        if (frameId === 'create-frame') createUI.reset();
        if (frameId === 'mp-create-frame') mpCreateUI.reset();
    },
    exitApp: () => {
        if (confirm("Close the browser window?")) {
            // Se for fechar a aba, já faz o leaveRoom para limpar o peerjs server
            if (app.isMultiplayer) mp.leaveRoom();
            window.close();
            document.getElementById('app').innerHTML = '<div class="container-center"><h1>Game Closed</h1><p class="subtitle">You can close this tab now.</p></div>';
        }
    }
};

// --- Multiplayer Network Logic (WebRTC via PeerJS) ---
const PLAYER_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#e84393'];

const mp = {
    peer: null,
    isHost: false,
    roomId: '',
    myId: null,
    isPrivate: false,
    password: '',
    maxPlayers: 4,
    myCurrentName: '',

    lobbyWords: [],
    lobbyGridSize: 12,

    connections: [],
    players: {},
    cellColors: {},
    hostConn: null,

    // Lista ordenada de IDs para decidir quem é o próximo host
    peerOrder: [],

    cleanup: () => {
        if (mp.peer) mp.peer.destroy();
        mp.peer = null;
        mp.connections = [];
        mp.hostConn = null;
        mp.players = {};
        mp.cellColors = {};
        mp.lobbyWords = [];
        mp.lobbyGridSize = 12;
        mp.peerOrder = [];
    },

    leaveRoom: () => {
        mp.cleanup();
        app.isMultiplayer = false;
        app.switchFrame('mp-menu-frame');
    },

    updateName: () => {
        const newName = document.getElementById('lobby-player-name').value.trim();
        if (!newName) return;
        mp.myCurrentName = newName;

        if (mp.isHost) {
            mp.players[mp.myId].name = newName;
            mp.broadcast({ type: 'LOBBY_UPDATE', players: mp.players, settings: { size: mp.lobbyGridSize, words: mp.lobbyWords }, peerOrder: mp.peerOrder });
            mp.updateLobbyUI();
        } else {
            mp.hostConn.send({ type: 'UPDATE_NAME', name: newName });
        }
    },

    // Finaliza a partida e distribui os pontos de vitória (Wins)
    endGameHost: () => {
        if (!mp.isHost) return;
        if (confirm("End the match and return everyone to the lobby?")) {
            mp.calculateAndBroadcastWins();
        }
    },

    calculateAndBroadcastWins: () => {
        let maxScore = -1;
        Object.values(mp.players).forEach(p => { if (p.score > maxScore) maxScore = p.score; });

        if (maxScore > 0) {
            Object.keys(mp.players).forEach(id => {
                if (mp.players[id].score === maxScore) {
                    mp.players[id].wins = (mp.players[id].wins || 0) + 1;
                }
            });
        }

        app.isMultiplayer = false;
        mp.broadcast({ type: 'GAME_OVER', players: mp.players });
        app.switchFrame('lobby-frame');
        mp.updateLobbyUI();
    },

    // O Host original cria a sala do zero
    createRoomHost: (hostName, isPrivate, password, maxPlayers) => {
        const btn = document.querySelector('#mp-create-frame .btn-success');

        mp.cleanup();
        mp.isHost = true;
        mp.isPrivate = isPrivate;
        mp.password = password;
        mp.maxPlayers = maxPlayers;
        mp.roomId = Math.random().toString(36).substring(2, 6).toUpperCase();

        try {
            mp.peer = new Peer(`ws-game-${mp.roomId.toLowerCase()}`);
        } catch (e) {
            if (btn) { btn.textContent = "Open Lobby"; btn.disabled = false; }
            return alert("Failed to initialize networking: " + e.message);
        }

        mp.peer.on('open', (id) => {
            if (btn) { btn.textContent = "Open Lobby"; btn.disabled = false; }
            mp.myId = id;
            mp.players[id] = { name: hostName, color: PLAYER_COLORS[0], score: 0, wins: 0 };
            mp.peerOrder = [id];

            document.getElementById('lobby-info-id').textContent = mp.roomId;
            document.getElementById('lobby-info-max').textContent = mp.maxPlayers;
            document.getElementById('lobby-info-pwd-wrap').style.display = mp.isPrivate ? 'block' : 'none';
            document.getElementById('lobby-info-pwd').textContent = mp.password;

            document.getElementById('btn-start-mp').style.display = 'block';
            document.getElementById('host-settings').style.display = 'block';
            document.getElementById('client-settings').style.display = 'none';

            app.switchFrame('lobby-frame');
            mp.updateLobbyUI();
        });

        mp.peer.on('error', (err) => {
            if (btn) { btn.textContent = "Open Lobby"; btn.disabled = false; }
            alert("Network Error: " + err.type);
            mp.leaveRoom();
        });

        mp.peer.on('connection', (conn) => mp.setupHostConnection(conn));
    },

    // A lógica de gerenciar uma nova conexão com o Host
    setupHostConnection: (conn) => {
        conn.on('open', () => {
            if (Object.keys(mp.players).length >= mp.maxPlayers) {
                conn.send({ type: 'AUTH_REJECTED', reason: 'Room is full!' });
                setTimeout(() => conn.close(), 500);
                return;
            }

            if (mp.isPrivate) {
                if (!conn.metadata || conn.metadata.password !== mp.password) {
                    conn.send({ type: 'AUTH_REJECTED', reason: 'Incorrect Password!' });
                    setTimeout(() => conn.close(), 500);
                    return;
                }
            }

            // Client Aceito. Adiciona à lista de Herança de Host
            mp.connections.push(conn);
            mp.peerOrder.push(conn.peer);

            // Resgata vitórias passadas do jogador se ele for novo na sala (sempre 0 ao entrar)
            const pCount = Object.keys(mp.players).length;
            const color = PLAYER_COLORS[pCount % PLAYER_COLORS.length];
            const pName = conn.metadata?.playerName || `Player ${pCount + 1}`;

            // Se o client reconectou (Migração), nós preservamos o "wins" que ele mandou. Senão, 0.
            const pWins = conn.metadata?.wins || 0;

            mp.players[conn.peer] = { name: pName, color: color, score: 0, wins: pWins };

            conn.send({ type: 'AUTH_ACCEPTED', roomId: mp.roomId, maxPlayers: mp.maxPlayers, isPrivate: mp.isPrivate, password: mp.password });
            mp.syncLobbySettings();

            if (app.isMultiplayer) {
                conn.send({
                    type: 'GAME_START',
                    gameData: mp.pendingGameData,
                    players: mp.players,
                    syncState: { wordsToFind: playUI.wordsToFind, cellColors: mp.cellColors }
                });
            }
        });

        conn.on('data', (data) => mp.handleDataFromClient(data, conn.peer));

        conn.on('close', () => {
            mp.connections = mp.connections.filter(c => c.peer !== conn.peer);
            mp.peerOrder = mp.peerOrder.filter(id => id !== conn.peer);
            if(mp.players[conn.peer]) {
                delete mp.players[conn.peer];
                mp.syncLobbySettings();
            }
        });
    },

    joinRoom: (forcedRoomId = null, forcedPwd = null, silent = false, previousWins = 0) => {
        const btn = document.querySelector('#mp-join-frame .btn-success');
        const inputName = document.getElementById('join-player-name').value.trim() || "Guest";

        const inputId = forcedRoomId || document.getElementById('join-room-id').value.trim().toUpperCase();
        const pwd = forcedPwd !== null ? forcedPwd : document.getElementById('join-room-pwd').value.trim();

        if (!inputId) return alert("Enter a Room ID");
        if (!silent && typeof Peer === 'undefined') return alert("WebRTC library failed to load.");

        if (btn && !silent) { btn.textContent = "Joining..."; btn.disabled = true; }

        mp.cleanup();
        mp.isHost = false;
        mp.roomId = inputId;
        mp.myCurrentName = inputName;

        mp.peer = new Peer();
        mp.peer.on('open', (id) => {
            mp.myId = id;
            // O Client envia seu nome e quantas vitórias já tinha (importante para Migração)
            mp.hostConn = mp.peer.connect(`ws-game-${mp.roomId.toLowerCase()}`, {
                metadata: { password: pwd, playerName: mp.myCurrentName, wins: previousWins }
            });

            mp.hostConn.on('data', (data) => mp.handleDataFromHost(data));

            mp.hostConn.on('close', () => {
                if (mp.peerOrder.length > 1) {
                    mp.handleHostMigration(); // Tenta migrar o Host se ele cair
                } else {
                    alert("Disconnected from Host.");
                    mp.leaveRoom();
                }
            });

            mp.hostConn.on('error', () => {
                if (btn && !silent) { btn.textContent = "Join"; btn.disabled = false; }
            });
        });

        mp.peer.on('error', (err) => {
            if (btn && !silent) { btn.textContent = "Join"; btn.disabled = false; }
            alert(`Connection error: ${err.type}`);
            mp.leaveRoom();
        });
    },

    // --- LÓGICA DE MIGRAÇÃO DE HOST ---
    handleHostMigration: () => {
        // Remove o Host antigo (que estava no index 0)
        mp.peerOrder.shift();
        const newHostId = mp.peerOrder[0];

        // Se EU for o próximo da fila, assumo o papel do Host
        if (mp.myId === newHostId) {

            // Salva o estado atual da sala
            const savedState = {
                roomId: mp.roomId,
                isPriv: mp.isPrivate,
                pwd: mp.password,
                max: mp.maxPlayers,
                words: mp.lobbyWords,
                size: mp.lobbyGridSize,
                myName: mp.myCurrentName,
                myWins: mp.players[mp.myId]?.wins || 0
            };

            mp.cleanup();

            // Aguarda 1.5s para o servidor do PeerJS liberar a tag da sala antiga
            setTimeout(() => {
                mp.isHost = true;
                mp.isPrivate = savedState.isPriv;
                mp.password = savedState.pwd;
                mp.maxPlayers = savedState.max;
                mp.roomId = savedState.roomId;
                mp.lobbyWords = savedState.words;
                mp.lobbyGridSize = savedState.size;

                mp.peer = new Peer(`ws-game-${mp.roomId.toLowerCase()}`);

                mp.peer.on('open', (id) => {
                    mp.myId = id;
                    // Eu me adiciono como Host mantendo minhas vitórias
                    mp.players[id] = { name: savedState.myName + ' (New Host)', color: PLAYER_COLORS[0], score: 0, wins: savedState.myWins };
                    mp.peerOrder = [id];

                    document.getElementById('lobby-info-id').textContent = mp.roomId;
                    document.getElementById('lobby-info-max').textContent = mp.maxPlayers;
                    document.getElementById('lobby-info-pwd-wrap').style.display = mp.isPrivate ? 'block' : 'none';
                    document.getElementById('lobby-info-pwd').textContent = mp.password;

                    document.getElementById('btn-start-mp').style.display = 'block';
                    document.getElementById('host-settings').style.display = 'block';
                    document.getElementById('client-settings').style.display = 'none';

                    app.isMultiplayer = false; // Força voltar ao lobby
                    app.switchFrame('lobby-frame');
                    mp.updateLobbyUI();
                    alert("The previous host left. YOU are the new Host!");
                });

                mp.peer.on('connection', (conn) => mp.setupHostConnection(conn));

            }, 1500);

        } else {
            // Se eu NÃO sou o próximo, aguardo 3 segundos e tento reconectar na mesma sala silenciosamente
            const rId = mp.roomId;
            const rPwd = mp.password;
            const myWins = mp.players[mp.myId]?.wins || 0;

            mp.cleanup();
            document.getElementById('lobby-players-list').innerHTML = "<li style='color: var(--btn-warn);'>Host left. Reconnecting to new Host...</li>";

            setTimeout(() => {
                mp.joinRoom(rId, rPwd, true, myWins);
            }, 3000);
        }
    },
    // ------------------------------------

    addLobbyWord: () => {
        const input = document.getElementById('lobby-new-word');
        const word = input.value.trim().toUpperCase();
        const size = parseInt(document.getElementById('lobby-grid-size').value);
        if (!word) return;
        if (word.length > size) return alert(`Word too long for grid size ${size}.`);

        if (!mp.lobbyWords.includes(word)) {
            mp.lobbyWords.push(word);
            input.value = '';
            mp.syncLobbySettings();
        }
    },

    removeLobbyWord: (index) => {
        mp.lobbyWords.splice(index, 1);
        mp.syncLobbySettings();
    },

    syncLobbySettings: () => {
        if (!mp.isHost) return;
        mp.lobbyGridSize = parseInt(document.getElementById('lobby-grid-size').value) || 12;

        const payload = {
            type: 'LOBBY_UPDATE',
            players: mp.players,
            peerOrder: mp.peerOrder,
            settings: { size: mp.lobbyGridSize, words: mp.lobbyWords }
        };
        mp.broadcast(payload);
        mp.updateLobbyUI();
    },

    broadcast: (data) => {
        mp.connections.forEach(conn => conn.send(data));
    },

    startGameHost: () => {
        if(mp.lobbyWords.length === 0) return alert("Add at least one word to start!");

        const ws = new WordSearchGenerator(mp.lobbyGridSize);
        const wordsPlaced = [];
        mp.lobbyWords.forEach(word => { if (ws.addWord(word)) wordsPlaced.push(word); });

        if (!wordsPlaced.length) return alert("Grid is too small to place any words!");
        ws.fillRandomLetters();

        mp.pendingGameData = { size: mp.lobbyGridSize, grid: ws.grid, words: wordsPlaced };

        app.isMultiplayer = true;
        Object.keys(mp.players).forEach(id => mp.players[id].score = 0);
        mp.cellColors = {};

        mp.broadcast({ type: 'GAME_START', gameData: mp.pendingGameData, players: mp.players });
        playUI.loadGame("Multiplayer Match", mp.pendingGameData, true);
        app.switchFrame('play-frame');
    },

    handleDataFromClient: (data, senderId) => {
        if (data.type === 'UPDATE_NAME') {
            if (mp.players[senderId]) {
                mp.players[senderId].name = data.name;
                mp.syncLobbySettings();
            }
        }
        else if (data.type === 'WORD_FOUND_REQ') {
            if (playUI.wordsToFind.includes(data.word)) {
                mp.players[senderId].score += 1;
                mp.broadcast({ type: 'WORD_FOUND_ACK', word: data.word, coords: data.coords, playerId: senderId, players: mp.players });
                playUI.applyRemoteFoundWord(data.word, data.coords, senderId);
            }
        }
    },

    handleDataFromHost: (data) => {
        const btn = document.querySelector('#mp-join-frame .btn-success');

        if (data.type === 'AUTH_REJECTED') {
            if (btn) { btn.textContent = "Join"; btn.disabled = false; }
            alert(data.reason);
            mp.leaveRoom();
        } else if (data.type === 'AUTH_ACCEPTED') {
            if (btn) { btn.textContent = "Join"; btn.disabled = false; }

            mp.isPrivate = data.isPrivate;
            mp.password = data.password;
            mp.maxPlayers = data.maxPlayers;

            document.getElementById('lobby-info-id').textContent = data.roomId;
            document.getElementById('lobby-info-max').textContent = data.maxPlayers;
            document.getElementById('lobby-info-pwd-wrap').style.display = data.isPrivate ? 'block' : 'none';
            document.getElementById('lobby-info-pwd').textContent = data.password;

            document.getElementById('btn-start-mp').style.display = 'none';
            document.getElementById('host-settings').style.display = 'none';
            document.getElementById('client-settings').style.display = 'block';

            // Popula o nome que a pessoa digitou na tela de Join
            document.getElementById('lobby-player-name').value = mp.myCurrentName;

            app.switchFrame('lobby-frame');

        } else if (data.type === 'LOBBY_UPDATE') {
            mp.players = data.players;
            mp.peerOrder = data.peerOrder;
            mp.lobbyGridSize = data.settings.size;
            mp.lobbyWords = data.settings.words;
            mp.updateLobbyUI();

        } else if (data.type === 'GAME_START') {
            app.isMultiplayer = true;
            mp.players = data.players;
            playUI.loadGame("Multiplayer Match", data.gameData, true);

            if (data.syncState) {
                playUI.wordsToFind = data.syncState.wordsToFind;
                playUI.updateWordList();
                Object.entries(data.syncState.cellColors).forEach(([coord, color]) => {
                    playUI.foundCells.add(coord);
                    const el = document.getElementById(`cell-${coord.replace(',', '-')}`);
                    if (el) {
                        el.classList.remove('selected');
                        el.style.backgroundColor = color;
                        el.style.color = '#ffffff';
                    }
                });
            }
            app.switchFrame('play-frame');

        } else if (data.type === 'WORD_FOUND_ACK') {
            mp.players = data.players;
            playUI.applyRemoteFoundWord(data.word, data.coords, data.playerId);

        } else if (data.type === 'GAME_OVER') {
            app.isMultiplayer = false;
            mp.players = data.players; // Atualiza com os wins calculados pelo host
            app.switchFrame('lobby-frame');
            mp.updateLobbyUI();
        }
    },

    updateLobbyUI: () => {
        document.getElementById('lobby-info-count').textContent = Object.keys(mp.players).length;

        const list = document.getElementById('lobby-players-list');
        list.innerHTML = '';
        Object.values(mp.players).forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="player-dot" style="background-color: ${p.color};"></span> ${p.name} <strong style="float:right; color:var(--cell-sel);">★ ${p.wins || 0}</strong>`;
            list.appendChild(li);
        });

        const wordList = document.getElementById('lobby-words-list');
        wordList.innerHTML = '';
        mp.lobbyWords.forEach((word, index) => {
            const li = document.createElement('li');
            li.textContent = "  " + word;

            if (mp.isHost) {
                const delBtn = document.createElement('button');
                delBtn.textContent = 'X';
                delBtn.style.float = 'right';
                delBtn.style.padding = '2px 6px';
                delBtn.style.background = 'var(--btn-danger)';
                delBtn.onclick = () => mp.removeLobbyWord(index);
                li.appendChild(delBtn);
            }
            wordList.appendChild(li);
        });

        if (!mp.isHost) {
            document.getElementById('lobby-view-size').textContent = mp.lobbyGridSize;
        }

        if (app.isMultiplayer) {
            const sbList = document.getElementById('scoreboard-list');
            sbList.innerHTML = '';
            Object.values(mp.players)
                .sort((a,b) => b.score - a.score)
                .forEach(p => {
                    const li = document.createElement('li');
                    li.className = 'player-score-item';
                    li.innerHTML = `<span style="color:${p.color};">${p.name}</span> <span>${p.score}</span>`;
                    sbList.appendChild(li);
                });
        }
    }
};

// --- Singleplayer Create Logic ---
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
        if (word.length > size) return alert(`The word '${word}' cannot fit in a ${size}x${size} grid.`);
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
        createUI.words.forEach(word => { if (ws.addWord(word)) wordsPlaced.push(word); });

        if (!wordsPlaced.length) return alert("Could not place any words.");
        ws.fillRandomLetters();

        const games = Storage.load();
        games[name] = { size: size, grid: ws.grid, words: wordsPlaced };
        Storage.save(games);
        alert(`Game '${name}' saved successfully!`);
        app.switchFrame('sp-menu-frame');
    }
};

// --- Multiplayer Create Settings ---
const mpCreateUI = {
    reset: () => {
        document.getElementById('mp-host-name').value = 'Host';
        document.getElementById('mp-room-type').value = 'public';
        document.getElementById('mp-room-pwd').value = '';
        document.getElementById('mp-max-players').value = '4';

        const btn = document.querySelector('#mp-create-frame .btn-success');
        if (btn) { btn.textContent = "Open Lobby"; btn.disabled = false; }

        mpCreateUI.togglePassword();
    },
    togglePassword: () => {
        const type = document.getElementById('mp-room-type').value;
        document.getElementById('mp-password-group').style.display = type === 'private' ? 'block' : 'none';
    },
    generateAndHost: () => {
        if (typeof Peer === 'undefined') {
            return alert("WebRTC (PeerJS) is not loaded. Please check your internet connection or disable adblockers.");
        }

        const btn = document.querySelector('#mp-create-frame .btn-success');
        const hName = document.getElementById('mp-host-name').value.trim() || 'Host';
        const isPrivate = document.getElementById('mp-room-type').value === 'private';
        const password = document.getElementById('mp-room-pwd').value.trim();
        const maxPlayers = parseInt(document.getElementById('mp-max-players').value) || 4;

        if (isPrivate && !password) return alert("Please enter a password for the private room.");

        if (btn) { btn.textContent = "Connecting..."; btn.disabled = true; }
        mp.createRoomHost(hName, isPrivate, password, maxPlayers);
    }
};

document.getElementById('create-word').addEventListener('keypress', (e) => { if (e.key === 'Enter') createUI.addWord(); });
document.getElementById('lobby-new-word').addEventListener('keypress', (e) => { if (e.key === 'Enter') mp.addLobbyWord(); });

// --- Select Game Logic (Singleplayer) ---
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
        if (defaultGames[selectUI.selectedGame]) return alert("You cannot delete the built-in default games.");
        if (confirm(`Delete '${selectUI.selectedGame}'?`)) {
            const games = Storage.load();
            delete games[selectUI.selectedGame];
            Storage.save(games);
            selectUI.refreshList();
        }
    },
    playGame: () => {
        if (!selectUI.selectedGame) return alert("Select a game first.");
        app.isMultiplayer = false;
        const data = Storage.load()[selectUI.selectedGame];
        playUI.loadGame(selectUI.selectedGame, data, false);
        app.switchFrame('play-frame');
    }
};

// --- Play Game Logic ---
const playUI = {
    size: 0, gridData: [], originalWords: [], wordsToFind: [],
    foundCells: new Set(), selectedCells: [], startCell: null,
    isDragging: false, isViewMode: false, hintActive: false, wordCoordsMap: {},

    loadGame: (name, data, isMp = false) => {
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

        if (isMp) {
            document.getElementById('sp-actions').style.display = 'none';
            document.getElementById('scoreboard-container').style.display = 'block';
            document.getElementById('btn-end-mp').style.display = mp.isHost ? 'block' : 'none';
            document.getElementById('btn-leave-mp').style.display = 'block';
            mp.updateLobbyUI();
        } else {
            document.getElementById('sp-actions').style.display = 'block';
            document.getElementById('scoreboard-container').style.display = 'none';
            document.getElementById('btn-end-mp').style.display = 'none';
            document.getElementById('btn-leave-mp').style.display = 'none';
        }

        playUI.wordCoordsMap = playUI._mapAllWords();
        playUI.updateWordList();
        playUI.renderGrid();
    },

    exitGame: () => {
        if(app.isMultiplayer) mp.leaveRoom();
        else app.switchFrame('sp-menu-frame');
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

                cell.onmousedown = (e) => playUI.onDragStart(r, c, e);
                cell.onmouseenter = () => playUI.onDragMotion(r, c);
                cell.onmouseup = () => playUI.onDragRelease();

                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    playUI.onDragStart(r, c, { button: 0 });
                }, { passive: false });

                container.appendChild(cell);
            }
        }

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
        if (playUI.isViewMode || e.button !== 0) return;
        playUI.isDragging = true;
        playUI.startCell = { r, c };
        playUI.updateDragSelection(r, c);
    },

    onDragMotion: (r, c) => {
        if (!playUI.isDragging || playUI.isViewMode) return;
        playUI.updateDragSelection(r, c);
    },

    onTouchMotion: (e) => {
        e.preventDefault();
        if (!playUI.isDragging || playUI.isViewMode) return;
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains('cell')) {
            playUI.updateDragSelection(parseInt(target.dataset.r), parseInt(target.dataset.c));
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
                if (!cellObj.classList.contains('hint') && !playUI.foundCells.has(`${r},${c}`)) {
                    cellObj.classList.add('selected');
                }
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
            if (app.isMultiplayer) {
                if (mp.isHost) {
                    mp.handleDataFromClient({ type: 'WORD_FOUND_REQ', word: foundWord, coords: playUI.selectedCells }, mp.myId);
                } else {
                    mp.hostConn.send({ type: 'WORD_FOUND_REQ', word: foundWord, coords: playUI.selectedCells });
                }
                playUI.clearCurrentSelectionColors();
            } else {
                playUI.applyRemoteFoundWord(foundWord, playUI.selectedCells, null);
            }
        } else {
            playUI.clearCurrentSelectionColors();
        }
        playUI.selectedCells = [];
    },

    applyRemoteFoundWord: (word, coords, playerId) => {
        if (!playUI.wordsToFind.includes(word)) return;

        playUI.wordsToFind = playUI.wordsToFind.filter(w => w !== word);
        playUI.updateWordList();

        if (app.isMultiplayer) mp.updateLobbyUI();

        let highlightColor = 'var(--cell-found)';
        if (app.isMultiplayer && mp.players[playerId]) {
            highlightColor = mp.players[playerId].color;
        }

        if (app.isMultiplayer && mp.isHost) {
            coords.forEach(coord => mp.cellColors[coord] = highlightColor);
        }

        coords.forEach(coord => {
            playUI.foundCells.add(coord);
            const el = document.getElementById(`cell-${coord.replace(',', '-')}`);
            el.classList.remove('selected');
            el.style.backgroundColor = highlightColor;
            el.style.color = '#ffffff';
        });

        if (playUI.wordsToFind.length === 0) {
            setTimeout(() => {
                if (app.isMultiplayer && mp.isHost) {
                    mp.calculateAndBroadcastWins();
                } else if (!app.isMultiplayer) {
                    alert("Congratulations! You found all the words!");
                }
            }, 1000); // 1 segundo de folga para os jogadores verem a última palavra
        }
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
