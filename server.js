const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Dados em memória
const rooms = new Map();
const players = new Map();

// Categorias padrão
const DEFAULT_CATEGORIES = [
    'Nome próprio',
    'Animal', 
    'Objeto',
    'Cor',
    'Comida',
    'País/Cidade',
    'Profissão'
];

// Letras do alfabeto (excluindo K, W, Y que são difíceis)
const ALPHABET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Z'];

// Fases do jogo
const GAME_PHASES = {
    WAITING: 'waiting',
    WRITING: 'writing', 
    VOTING: 'voting',
    FINISHED: 'finished'
};

class Room {
    constructor(name, isPrivate, hostId) {
        this.id = uuidv4();
        this.name = name;
        this.isPrivate = isPrivate;
        this.hostId = hostId;
        this.players = new Map();
        this.categories = [...DEFAULT_CATEGORIES];
        this.usedLetters = [];
        this.currentLetter = null;
        this.phase = GAME_PHASES.WAITING;
        this.answers = new Map(); // playerId -> {category -> answer}
        this.votes = new Map(); // playerId -> {category -> votes}
        this.scores = new Map(); // playerId -> score
        this.currentVotingPlayer = null;
        this.currentVotingCategory = null;
        this.votingQueue = [];
    }

    addPlayer(player) {
        this.players.set(player.id, player);
        this.scores.set(player.id, 0);
    }    removePlayer(playerId) {
        this.players.delete(playerId);
        this.scores.delete(playerId);
        this.answers.delete(playerId);
        this.votes.delete(playerId);
    }

    resetGame() {
        // Resetar estado do jogo
        this.usedLetters = [];
        this.currentLetter = null;
        this.phase = GAME_PHASES.WAITING;
        this.answers.clear();
        this.votes.clear();
        this.currentVotingPlayer = null;
        this.currentVotingCategory = null;
        this.votingQueue = [];
        
        // Zerar pontuação de todos os jogadores
        for (const playerId of this.players.keys()) {
            this.scores.set(playerId, 0);
        }
    }

    canStart() {
        return this.players.size >= 2 && this.phase === GAME_PHASES.WAITING;
    }

    getAvailableLetters() {
        return ALPHABET.filter(letter => !this.usedLetters.includes(letter));
    }

    startWritingPhase() {
        const availableLetters = this.getAvailableLetters();
        if (availableLetters.length === 0) {
            this.phase = GAME_PHASES.FINISHED;
            return false;
        }

        this.currentLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
        this.usedLetters.push(this.currentLetter);
        this.phase = GAME_PHASES.WRITING;
        this.answers.clear();
        this.votes.clear();
        return true;
    }

    submitAnswers(playerId, answers) {
        this.answers.set(playerId, answers);
    }

    allPlayersAnswered() {
        return this.answers.size === this.players.size;
    }

    startVotingPhase() {
        this.phase = GAME_PHASES.VOTING;
        this.setupVotingQueue();
    }

    setupVotingQueue() {
        this.votingQueue = [];
        const playerIds = Array.from(this.players.keys());
        
        for (const category of this.categories) {
            for (const playerId of playerIds) {
                this.votingQueue.push({ playerId, category });
            }
        }
        
        this.nextVoting();
    }    nextVoting() {
        if (this.votingQueue.length === 0) {
            this.calculateScores();
            if (this.getAvailableLetters().length > 0) {
                this.phase = GAME_PHASES.WAITING;
            } else {
                this.phase = GAME_PHASES.FINISHED;
            }
            return false;
        }

        const next = this.votingQueue.shift();
        this.currentVotingPlayer = next.playerId;
        this.currentVotingCategory = next.category;
        this.votes.set(next.playerId + '_' + next.category, new Map());
        return true;
    }

    submitVote(voterId, isValid) {
        const voteKey = this.currentVotingPlayer + '_' + this.currentVotingCategory;
        const votes = this.votes.get(voteKey) || new Map();
        votes.set(voterId, isValid);
        this.votes.set(voteKey, votes);
    }

    canProceedVoting() {
        const voteKey = this.currentVotingPlayer + '_' + this.currentVotingCategory;
        const votes = this.votes.get(voteKey) || new Map();
        const eligibleVoters = Array.from(this.players.keys()).filter(id => id !== this.currentVotingPlayer);
        return votes.size === eligibleVoters.length;
    }

    calculateScores() {
        // Resetar pontuação da rodada
        const roundScores = new Map();
        Array.from(this.players.keys()).forEach(id => roundScores.set(id, 0));

        for (const category of this.categories) {
            // Agrupar respostas iguais
            const answerGroups = new Map();
            
            for (const [playerId, answers] of this.answers) {
                const answer = answers[category]?.toLowerCase().trim();
                if (answer) {
                    if (!answerGroups.has(answer)) {
                        answerGroups.set(answer, []);
                    }
                    answerGroups.get(answer).push(playerId);
                }
            }

            // Calcular pontos para cada jogador
            for (const [playerId, answers] of this.answers) {
                const answer = answers[category]?.toLowerCase().trim();
                if (!answer) continue;

                const voteKey = playerId + '_' + category;
                const votes = this.votes.get(voteKey) || new Map();
                const validVotes = Array.from(votes.values()).filter(vote => vote === true).length;
                const totalVotes = votes.size;

                // Verificar se a resposta foi considerada válida pela maioria
                const isValid = validVotes > totalVotes / 2;

                if (isValid) {
                    const playersWithSameAnswer = answerGroups.get(answer) || [];
                    const points = playersWithSameAnswer.length > 1 ? 5 : 10;
                    roundScores.set(playerId, roundScores.get(playerId) + points);
                }
            }
        }

        // Adicionar pontos da rodada ao total
        for (const [playerId, roundPoints] of roundScores) {
            const currentScore = this.scores.get(playerId) || 0;
            this.scores.set(playerId, currentScore + roundPoints);
        }
    }

    getRanking() {
        return Array.from(this.scores.entries())
            .map(([playerId, score]) => ({
                player: this.players.get(playerId),
                score
            }))
            .sort((a, b) => b.score - a.score);
    }
}

class Player {
    constructor(nickname, socketId) {
        this.id = uuidv4();
        this.nickname = nickname;
        this.socketId = socketId;
        this.roomId = null;
    }
}

// Conexão Socket.IO
io.on('connection', (socket) => {
    console.log('Novo jogador conectado:', socket.id);

    // Criar jogador
    socket.on('createPlayer', (nickname) => {
        const player = new Player(nickname, socket.id);
        players.set(socket.id, player);
        socket.emit('playerCreated', { playerId: player.id, nickname: player.nickname });
    });

    // Criar sala
    socket.on('createRoom', (data) => {
        const player = players.get(socket.id);
        if (!player) return;

        const room = new Room(data.roomName, data.isPrivate, player.id);
        room.addPlayer(player);
        player.roomId = room.id;
        rooms.set(room.id, room);
        
        socket.join(room.id);
        socket.emit('roomCreated', {
            roomId: room.id,
            roomName: room.name,
            isHost: true
        });
        
        emitRoomUpdate(room);
    });

    // Listar salas públicas
    socket.on('listPublicRooms', () => {
        const publicRooms = Array.from(rooms.values())
            .filter(room => !room.isPrivate && room.phase === GAME_PHASES.WAITING)
            .map(room => ({
                id: room.id,
                name: room.name,
                playerCount: room.players.size,
                maxPlayers: 8
            }));
        
        socket.emit('publicRoomsList', publicRooms);
    });

    // Buscar sala por código
    socket.on('findRoomByCode', (roomId) => {
        const room = rooms.get(roomId);
        if (room && room.phase === GAME_PHASES.WAITING) {
            socket.emit('roomFound', {
                id: room.id,
                name: room.name,
                playerCount: room.players.size,
                isPrivate: room.isPrivate
            });
        } else {
            socket.emit('roomNotFound');
        }
    });

    // Entrar na sala
    socket.on('joinRoom', (roomId) => {
        const player = players.get(socket.id);
        const room = rooms.get(roomId);
        
        if (!player || !room || room.phase !== GAME_PHASES.WAITING) {
            socket.emit('joinRoomError', 'Não foi possível entrar na sala');
            return;
        }

        room.addPlayer(player);
        player.roomId = room.id;
        socket.join(room.id);
        
        socket.emit('roomJoined', {
            roomId: room.id,
            roomName: room.name,
            isHost: room.hostId === player.id
        });
        
        emitRoomUpdate(room);
    });

    // Adicionar categoria personalizada
    socket.on('addCategory', (category) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.hostId !== player.id) return;
        
        if (!room.categories.includes(category)) {
            room.categories.push(category);
            emitRoomUpdate(room);
        }
    });

    // Remover categoria
    socket.on('removeCategory', (category) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.hostId !== player.id) return;
        
        const index = room.categories.indexOf(category);
        if (index > -1 && room.categories.length > 1) {
            room.categories.splice(index, 1);
            emitRoomUpdate(room);
        }
    });

    // Iniciar jogo
    socket.on('startGame', () => {
        const player = players.get(socket.id);
        if (!player) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.hostId !== player.id || !room.canStart()) return;
        
        if (room.startWritingPhase()) {
            emitGameUpdate(room);
        }
    });

    // Enviar respostas
    socket.on('submitAnswers', (answers) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.phase !== GAME_PHASES.WRITING) return;
        
        room.submitAnswers(player.id, answers);
        emitRoomUpdate(room);
    });    // Apertar STOP
    socket.on('callStop', () => {
        const player = players.get(socket.id);
        if (!player) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.phase !== GAME_PHASES.WRITING) return;
        
        // Qualquer jogador pode chamar STOP a qualquer momento
        room.startVotingPhase();
        emitGameUpdate(room);
    });    // Votar
    socket.on('vote', (isValid) => {
        const player = players.get(socket.id);
        if (!player) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.phase !== GAME_PHASES.VOTING) return;
        
        room.submitVote(player.id, isValid);
        
        if (room.canProceedVoting()) {
            if (!room.nextVoting()) {
                // Votação terminou
                if (room.phase === GAME_PHASES.FINISHED) {
                    emitGameFinished(room);
                } else {
                    // Fase de aguardo entre rodadas
                    emitRoundTransition(room);
                }
            } else {
                emitGameUpdate(room);
            }
        } else {
            emitRoomUpdate(room);
        }
    });

    // Próxima rodada
    socket.on('nextRound', () => {
        const player = players.get(socket.id);
        if (!player) return;
        
        const room = rooms.get(player.roomId);
        if (!room || room.hostId !== player.id || room.phase !== GAME_PHASES.WAITING) return;
        
        if (room.startWritingPhase()) {
            emitGameUpdate(room);
        }    });

    // Encerrar jogo
    socket.on('endGame', () => {
        console.log('EndGame recebido de:', socket.id);
        const player = players.get(socket.id);
        if (!player) {
            console.log('Player não encontrado');
            return;
        }
        
        const room = rooms.get(player.roomId);
        if (!room || room.hostId !== player.id) {
            console.log('Room não encontrada ou player não é host');
            return;
        }
        
        console.log('Resetando jogo na sala:', room.id);
        // Resetar jogo ao invés de finalizar
        room.resetGame();
        emitGameReset(room);
    });

    // Desconexão
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player && player.roomId) {
            const room = rooms.get(player.roomId);
            if (room) {
                room.removePlayer(player.id);
                
                if (room.players.size === 0) {
                    rooms.delete(room.id);
                } else if (room.hostId === player.id) {
                    // Transferir host para outro jogador
                    const newHost = Array.from(room.players.keys())[0];
                    room.hostId = newHost;
                }
                
                emitRoomUpdate(room);
            }
        }
        players.delete(socket.id);
        console.log('Jogador desconectado:', socket.id);
    });
});

// Funções auxiliares
function emitRoomUpdate(room) {
    if (!room) return;
    
    const roomData = {
        id: room.id,
        name: room.name,
        phase: room.phase,
        players: Array.from(room.players.values()).map(p => ({
            id: p.id,
            nickname: p.nickname,
            isHost: p.id === room.hostId
        })),
        categories: room.categories,
        canStart: room.canStart(),
        answeredPlayers: room.answers.size,
        totalPlayers: room.players.size,
        scores: Object.fromEntries(room.scores)
    };
    
    io.to(room.id).emit('roomUpdate', roomData);
}

function emitGameUpdate(room) {
    if (!room) return;
    
    const gameData = {
        phase: room.phase,
        currentLetter: room.currentLetter,
        categories: room.categories,
        usedLetters: room.usedLetters,
        availableLetters: room.getAvailableLetters().length,
        answeredPlayers: room.answers.size,
        totalPlayers: room.players.size
    };

    if (room.phase === GAME_PHASES.VOTING && room.currentVotingPlayer) {
        const currentPlayer = room.players.get(room.currentVotingPlayer);
        const answer = room.answers.get(room.currentVotingPlayer)?.[room.currentVotingCategory] || '';
        
        gameData.voting = {
            player: currentPlayer?.nickname || '',
            category: room.currentVotingCategory,
            answer: answer,
            votesReceived: (room.votes.get(room.currentVotingPlayer + '_' + room.currentVotingCategory) || new Map()).size,
            votesNeeded: room.players.size - 1
        };
    }
    
    io.to(room.id).emit('gameUpdate', gameData);
    emitRoomUpdate(room);
}

function emitGameFinished(room) {
    if (!room) return;
    
    const ranking = room.getRanking();
    io.to(room.id).emit('gameFinished', { ranking });
    emitRoomUpdate(room);
}

function emitRoundTransition(room) {
    if (!room) return;
    
    // Emitir pontuação atual e aguardar decisão do host
    io.to(room.id).emit('roundFinished', {
        scores: room.getRanking(),
        nextRoundIn: 10, // 10 segundos para o host decidir
        availableLetters: room.getAvailableLetters().length
    });
    
    emitRoomUpdate(room);
    
    // Auto-continuar apenas se host não decidir em 10 segundos
    setTimeout(() => {
        if (room.phase === GAME_PHASES.WAITING && room.getAvailableLetters().length > 0) {
            if (room.startWritingPhase()) {
                emitGameUpdate(room);
            }        }
    }, 10000); // 10 segundos
}

function emitGameReset(room) {
    if (!room) return;
    
    console.log('Emitindo gameReset para sala:', room.id);
    // Notificar que o jogo foi resetado
    io.to(room.id).emit('gameReset', {
        message: 'Jogo encerrado pelo host. Pontuação zerada.',
        hostName: room.players.get(room.hostId)?.nickname || 'Host'
    });
    
    // Emitir atualização da sala
    emitRoomUpdate(room);
}

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎯 Servidor Adedonha Online rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
});

// Export para compatibilidade com Vercel
module.exports = app;
