const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);

// Configuração do Socket.IO para Vercel
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['polling'], // Apenas polling para Vercel
    allowEIO3: true
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        environment: 'vercel',
        timestamp: new Date().toISOString() 
    });
});

// Dados em memória (limitado para Vercel)
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

// Socket.IO connections (limitado para Vercel)
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    socket.on('createPlayer', (nickname) => {
        const player = {
            id: socket.id,
            nickname: nickname,
            socketId: socket.id
        };
        players.set(socket.id, player);
        socket.emit('playerCreated', player);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        players.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3000;

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
    httpServer.listen(PORT, () => {
        console.log(`🎯 Servidor rodando na porta ${PORT}`);
    });
}

// Export para Vercel
module.exports = app;
