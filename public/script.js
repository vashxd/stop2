// Conectar ao servidor Socket.IO
const socket = io();

// Estado do jogo
let gameState = {
    player: null,
    room: null,
    isHost: false,
    currentScreen: 'home'
};

// Elementos DOM
const screens = {
    home: document.getElementById('homeScreen'),
    createRoom: document.getElementById('createRoomScreen'),
    findRoom: document.getElementById('findRoomScreen'),
    room: document.getElementById('roomScreen'),
    game: document.getElementById('gameScreen'),
    voting: document.getElementById('votingScreen'),
    roundTransition: document.getElementById('roundTransitionScreen'),
    ranking: document.getElementById('rankingScreen')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showScreen('home');
});

// Configurar event listeners
function setupEventListeners() {
    // Tela inicial
    document.getElementById('createRoomBtn').addEventListener('click', () => {
        const nickname = document.getElementById('nicknameInput').value.trim();
        if (nickname) {
            socket.emit('createPlayer', nickname);
            showScreen('createRoom');
        } else {
            showNotification('Digite um nickname válido!');
        }
    });

    document.getElementById('findRoomBtn').addEventListener('click', () => {
        const nickname = document.getElementById('nicknameInput').value.trim();
        if (nickname) {
            socket.emit('createPlayer', nickname);
            showScreen('findRoom');
            loadPublicRooms();
        } else {
            showNotification('Digite um nickname válido!');
        }
    });

    // Criar sala
    document.getElementById('confirmCreateRoomBtn').addEventListener('click', () => {
        const roomName = document.getElementById('roomNameInput').value.trim();
        const isPrivate = document.getElementById('privateRoomCheckbox').checked;
        
        if (roomName) {
            socket.emit('createRoom', { roomName, isPrivate });
        } else {
            showNotification('Digite um nome válido para a sala!');
        }
    });

    document.getElementById('backFromCreateBtn').addEventListener('click', () => {
        showScreen('home');
    });

    // Buscar salas
    document.getElementById('searchRoomBtn').addEventListener('click', () => {
        const roomCode = document.getElementById('roomCodeInput').value.trim();
        if (roomCode) {
            socket.emit('findRoomByCode', roomCode);
        }
    });

    document.getElementById('refreshRoomsBtn').addEventListener('click', loadPublicRooms);

    document.getElementById('backFromFindBtn').addEventListener('click', () => {
        showScreen('home');
    });

    // Controles da sala
    document.getElementById('startGameBtn').addEventListener('click', () => {
        socket.emit('startGame');
    });

    document.getElementById('nextRoundBtn').addEventListener('click', () => {
        socket.emit('nextRound');
    });

    document.getElementById('endGameBtn').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja encerrar o jogo?')) {
            socket.emit('endGame');
        }
    });

    document.getElementById('addCategoryBtn').addEventListener('click', () => {
        const category = document.getElementById('newCategoryInput').value.trim();
        if (category) {
            socket.emit('addCategory', category);
            document.getElementById('newCategoryInput').value = '';
        }
    });    // Controles do jogo
    document.getElementById('stopBtn').addEventListener('click', () => {
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn.disabled) return;
        
        // Enviar respostas automaticamente
        const answers = collectAnswers();
        socket.emit('submitAnswers', answers);
        
        // Feedback visual
        stopBtn.textContent = 'STOP CHAMADO!';
        stopBtn.disabled = true;
        stopBtn.classList.add('btn-success');
        stopBtn.classList.remove('btn-danger');
        
        // Chamar STOP
        socket.emit('callStop');
    });

    // Controles de votação
    document.getElementById('validBtn').addEventListener('click', () => {
        socket.emit('vote', true);
        disableVotingButtons();
    });

    document.getElementById('invalidBtn').addEventListener('click', () => {
        socket.emit('vote', false);
        disableVotingButtons();
    });    // Controles do ranking
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        showScreen('room');
    });

    document.getElementById('backToMenuBtn').addEventListener('click', () => {
        socket.disconnect();
        socket.connect();
        gameState = { player: null, room: null, isHost: false, currentScreen: 'home' };        showScreen('home');
    });

    // Controles da transição entre rodadas (somente host)
    document.getElementById('continueGameBtn').addEventListener('click', () => {
        // Limpar timer automático se existir
        if (window.gameTimers && window.gameTimers.autoRound) {
            clearTimeout(window.gameTimers.autoRound);
        }
        socket.emit('nextRound');
        hideHostRoundControls();
    });

    document.getElementById('endGameNowBtn').addEventListener('click', () => {
        console.log('Botão endGame clicado');
        // Limpar timer automático se existir
        if (window.gameTimers && window.gameTimers.autoRound) {
            clearTimeout(window.gameTimers.autoRound);
        }
        if (confirm('Tem certeza que deseja encerrar o jogo?\n\nIsso irá:\n• Voltar para a sala inicial\n• Zerar toda a pontuação\n• Permitir iniciar um novo jogo')) {
            console.log('Enviando endGame para servidor');
            socket.emit('endGame');
        }
    });

    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('notificationModal').addEventListener('click', (e) => {
        if (e.target.id === 'notificationModal') {
            closeModal();
        }
    });
}

// Socket event listeners
socket.on('playerCreated', (data) => {
    gameState.player = data;
});

socket.on('roomCreated', (data) => {
    gameState.room = data;
    gameState.isHost = data.isHost;
    showScreen('room');
    updateRoomInfo();
});

socket.on('roomJoined', (data) => {
    gameState.room = data;
    gameState.isHost = data.isHost;
    showScreen('room');
    updateRoomInfo();
});

socket.on('joinRoomError', (message) => {
    showNotification(message);
});

socket.on('publicRoomsList', (rooms) => {
    displayPublicRooms(rooms);
});

socket.on('roomFound', (room) => {
    if (confirm(`Entrar na sala "${room.name}"?`)) {
        socket.emit('joinRoom', room.id);
    }
});

socket.on('roomNotFound', () => {
    showNotification('Sala não encontrada ou não disponível!');
});

socket.on('roomUpdate', (roomData) => {
    updateRoomDisplay(roomData);
});

socket.on('gameUpdate', (gameData) => {
    updateGameDisplay(gameData);
});

socket.on('gameFinished', (data) => {
    displayRanking(data.ranking);
    showScreen('ranking');
});

socket.on('roundFinished', (data) => {
    displayRoundTransition(data);
});

socket.on('gameReset', (data) => {
    console.log('GameReset recebido:', data);
    showNotification(`${data.hostName} encerrou o jogo. Pontuação zerada!`);
    showScreen('room');
    
    // Esconder scoreboard se estiver visível
    const scoreboard = document.getElementById('scoreboard');
    if (scoreboard) {
        scoreboard.style.display = 'none';
    }
});

// Funções de tela
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
    gameState.currentScreen = screenName;
}

// Funções de sala
function updateRoomInfo() {
    if (!gameState.room) return;
    
    document.getElementById('roomTitle').textContent = gameState.room.roomName;
    document.getElementById('roomCode').textContent = `Código: ${gameState.room.roomId}`;
}

function updateRoomDisplay(roomData) {
    if (!roomData) return;

    // Atualizar informações da sala
    document.getElementById('gamePhase').textContent = getPhaseText(roomData.phase);
    document.getElementById('playerCount').textContent = roomData.players.length;

    // Atualizar lista de jogadores
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    roomData.players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        const playerInfo = document.createElement('div');
        playerInfo.innerHTML = `
            <span class="player-name">${player.nickname}</span>
            ${player.isHost ? '<span class="player-badge">HOST</span>' : ''}
        `;
        
        const playerScore = document.createElement('div');
        if (roomData.scores && roomData.scores[player.id] !== undefined) {
            playerScore.innerHTML = `<span class="player-score">${roomData.scores[player.id]} pts</span>`;
        }
        
        playerItem.appendChild(playerInfo);
        playerItem.appendChild(playerScore);
        playersList.appendChild(playerItem);
    });

    // Atualizar categorias
    updateCategoriesList(roomData.categories);

    // Controles do host
    const isHost = gameState.isHost;
    document.getElementById('addCategorySection').style.display = isHost ? 'block' : 'none';
    document.getElementById('startGameBtn').style.display = isHost && roomData.canStart ? 'block' : 'none';
    document.getElementById('nextRoundBtn').style.display = isHost && roomData.phase === 'waiting' && roomData.players.length >= 2 ? 'block' : 'none';
    document.getElementById('endGameBtn').style.display = isHost && roomData.phase !== 'waiting' ? 'block' : 'none';

    // Atualizar scoreboard se em jogo
    if (roomData.phase !== 'waiting' && roomData.scores) {
        updateScoreboard(roomData.players, roomData.scores);
    }

    // Mostrar progresso se na fase de escrita
    if (roomData.phase === 'writing') {
        document.getElementById('playersAnswered').textContent = `${roomData.answeredPlayers}/${roomData.totalPlayers} jogadores responderam`;
    }
}

function updateCategoriesList(categories) {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <span>${category}</span>
            ${gameState.isHost ? `<button class="category-remove" onclick="removeCategory('${category}')">×</button>` : ''}
        `;
        categoriesList.appendChild(categoryItem);
    });
}

function removeCategory(category) {
    socket.emit('removeCategory', category);
}

function updateGameDisplay(gameData) {
    if (gameData.phase === 'writing') {
        showWritingPhase(gameData);
    } else if (gameData.phase === 'voting') {
        showVotingPhase(gameData);
    }
}

function showWritingPhase(gameData) {
    showScreen('game');
    
    document.getElementById('currentLetter').textContent = gameData.currentLetter;
    document.getElementById('gameStatus').textContent = 'Escrevendo respostas...';
    document.getElementById('playersAnswered').textContent = `${gameData.answeredPlayers}/${gameData.totalPlayers} jogadores responderam`;
    
    // Criar inputs para categorias
    const categoriesInputs = document.getElementById('categoriesInputs');
    categoriesInputs.innerHTML = '';
      gameData.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-input';
        categoryDiv.innerHTML = `
            <label for="${category}">${category}:</label>
            <input type="text" id="${category}" name="${category}" placeholder="Palavra com ${gameData.currentLetter}..." oninput="checkAnswersComplete()">        `;
        categoriesInputs.appendChild(categoryDiv);
    });

    // Habilitar botão STOP inicialmente baseado nas respostas atuais
    checkAnswersComplete();
}

function showVotingPhase(gameData) {
    showScreen('voting');
    
    if (gameData.voting) {
        document.getElementById('votingPlayer').textContent = gameData.voting.player;
        document.getElementById('votingCategory').textContent = gameData.voting.category;
        document.getElementById('votingAnswer').textContent = gameData.voting.answer || '(Sem resposta)';
        document.getElementById('votingProgress').textContent = `${gameData.voting.votesReceived}/${gameData.voting.votesNeeded} votos recebidos`;
        
        enableVotingButtons();
    }
}

function collectAnswers() {
    const answers = {};
    const inputs = document.querySelectorAll('#categoriesInputs input');
    
    inputs.forEach(input => {
        answers[input.name] = input.value.trim();
    });
    
    return answers;
}

function checkAnswersComplete() {
    const inputs = document.querySelectorAll('#categoriesInputs input');
    const stopBtn = document.getElementById('stopBtn');
    
    if (!stopBtn || inputs.length === 0) return;
    
    // Verificar se pelo menos uma resposta foi preenchida
    let hasAnswers = false;
    inputs.forEach(input => {
        if (input.value.trim()) {
            hasAnswers = true;
        }
    });
    
    // Habilitar botão se tiver pelo menos uma resposta
    stopBtn.disabled = !hasAnswers;
    
    if (hasAnswers) {
        stopBtn.textContent = 'STOP!';
        stopBtn.classList.remove('btn-secondary');
        stopBtn.classList.add('btn-danger');
    } else {
        stopBtn.textContent = 'Preencha pelo menos uma categoria';
        stopBtn.classList.remove('btn-danger');
        stopBtn.classList.add('btn-secondary');
    }
    
    // Enviar respostas automaticamente enquanto o jogador digita
    if (hasAnswers) {
        const answers = collectAnswers();
        socket.emit('submitAnswers', answers);
    }
}

function enableVotingButtons() {
    document.getElementById('validBtn').disabled = false;
    document.getElementById('invalidBtn').disabled = false;
}

function disableVotingButtons() {
    document.getElementById('validBtn').disabled = true;
    document.getElementById('invalidBtn').disabled = true;
}

function displayRanking(ranking) {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';
    
    ranking.forEach((entry, index) => {
        const rankingItem = document.createElement('div');
        rankingItem.className = 'ranking-item';
        
        const position = index + 1;
        const positionClass = position === 1 ? 'first' : position === 2 ? 'second' : position === 3 ? 'third' : '';
        
        rankingItem.innerHTML = `
            <div class="ranking-position ${positionClass}">${position}º</div>
            <div class="ranking-player">${entry.player.nickname}</div>
            <div class="ranking-score">${entry.score} pts</div>
        `;
        
        rankingList.appendChild(rankingItem);    });
}

function displayRoundTransition(data) {
    // Mostrar a nova tela de transição
    showScreen('roundTransition');
    
    // Exibir pontuação atual
    displayCurrentScores(data.scores);
    
    // Configurar controles do host
    const hostControls = document.getElementById('hostRoundControls');
    if (gameState.isHost) {
        hostControls.style.display = 'flex';
    } else {
        hostControls.style.display = 'none';
    }
    
    // Configurar countdown
    document.getElementById('roundStatus').textContent = `Rodada finalizada! Restam ${data.availableLetters} letras.`;
    
    let countdown = data.nextRoundIn || 5;
    const countdownElement = document.getElementById('countdown');
    const nextRoundMessage = document.getElementById('nextRoundMessage');
    
    // Se é host, dar opção de escolher
    if (gameState.isHost) {
        nextRoundMessage.innerHTML = 'Escolha uma opção ou aguarde <span id="countdown">' + countdown + '</span> segundos para continuar automaticamente.';        
        // Auto-continuar se host não escolher
        const autoTimer = setTimeout(() => {
            socket.emit('nextRound');
            hideHostRoundControls();
        }, countdown * 1000);
        
        // Armazenar referência do timer para limpar quando necessário
        if (!window.gameTimers) window.gameTimers = {};
        window.gameTimers.autoRound = autoTimer;
    } else {
        nextRoundMessage.innerHTML = 'Aguardando decisão do host... Próxima rodada em <span id="countdown">' + countdown + '</span> segundos.';
    }
    
    // Countdown visual
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
        }    }, 1000);
}

function displayCurrentScores(scores) {
    const scoresList = document.getElementById('currentScoresList');
    scoresList.innerHTML = '';
    
    scores.forEach((entry, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item-large';
        
        const position = index + 1;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}º`;
        
        scoreItem.innerHTML = `
            <span class="player-name">${medal} ${entry.player.nickname}</span>
            <span class="player-points">${entry.score} pts</span>
        `;
        
        scoresList.appendChild(scoreItem);
    });
}

function hideHostRoundControls() {
    const hostControls = document.getElementById('hostRoundControls');
    hostControls.style.display = 'none';
    
    const nextRoundMessage = document.getElementById('nextRoundMessage');
    nextRoundMessage.textContent = 'Iniciando próxima rodada...';
}

function updateScoreboard(players, scores) {
    const scoreboard = document.getElementById('scoreboard');
    const scoresList = document.getElementById('scoresList');
    
    // Ordenar jogadores por pontuação
    const sortedPlayers = players
        .map(player => ({
            nickname: player.nickname,
            score: scores[player.id] || 0
        }))
        .sort((a, b) => b.score - a.score);
    
    scoresList.innerHTML = '';
    sortedPlayers.forEach(player => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        scoreItem.innerHTML = `
            <span>${player.nickname}</span>
            <span>${player.score}</span>
        `;
        scoresList.appendChild(scoreItem);
    });
    
    scoreboard.style.display = 'block';
}

// Funções de busca de salas
function loadPublicRooms() {
    socket.emit('listPublicRooms');
}

function displayPublicRooms(rooms) {
    const roomsList = document.getElementById('publicRoomsList');
    
    if (rooms.length === 0) {
        roomsList.innerHTML = '<div class="loading">Nenhuma sala pública disponível</div>';
        return;
    }
    
    roomsList.innerHTML = '';
    rooms.forEach(room => {
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item';
        roomItem.onclick = () => joinRoom(room.id);
        
        roomItem.innerHTML = `
            <div class="room-info-left">
                <div class="room-name">${room.name}</div>
                <div class="room-players">${room.playerCount}/${room.maxPlayers} jogadores</div>
            </div>
        `;
        
        roomsList.appendChild(roomItem);
    });
}

function joinRoom(roomId) {
    socket.emit('joinRoom', roomId);
}

// Funções auxiliares
function getPhaseText(phase) {
    switch (phase) {
        case 'waiting': return 'Aguardando início...';
        case 'writing': return 'Fase de escrita';
        case 'voting': return 'Fase de votação';
        case 'finished': return 'Jogo finalizado';
        default: return 'Aguardando...';
    }
}

function showNotification(message) {
    document.getElementById('notificationText').textContent = message;
    document.getElementById('notificationModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('notificationModal').style.display = 'none';
}

// Eventos de teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
    
    if (e.key === 'Enter') {
        const activeScreen = gameState.currentScreen;
        
        if (activeScreen === 'home') {
            const nickname = document.getElementById('nicknameInput').value.trim();
            if (nickname) {
                document.getElementById('createRoomBtn').click();
            }
        } else if (activeScreen === 'createRoom') {
            const roomName = document.getElementById('roomNameInput').value.trim();
            if (roomName) {
                document.getElementById('confirmCreateRoomBtn').click();
            }
        } else if (activeScreen === 'findRoom') {
            const roomCode = document.getElementById('roomCodeInput').value.trim();
            if (roomCode) {
                document.getElementById('searchRoomBtn').click();
            }
        }
    }
});

// Auto-focus nos inputs
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const nicknameInput = document.getElementById('nicknameInput');
        if (nicknameInput) {
            nicknameInput.focus();
        }
    }, 100);
});

// Prevenir saída acidental durante o jogo
window.addEventListener('beforeunload', (e) => {
    if (gameState.currentScreen === 'game' || gameState.currentScreen === 'voting') {
        e.preventDefault();
        e.returnValue = 'Você tem certeza que deseja sair durante o jogo?';
        return e.returnValue;
    }
});

console.log('🎯 Adedonha Online - Cliente carregado!');
