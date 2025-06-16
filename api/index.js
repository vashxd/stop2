const express = require('express');
const path = require('path');

const app = express();

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota principal - servir página de demo para Vercel
app.get('/', (req, res) => {
    // Detectar se está na Vercel
    const isVercel = req.headers.host && req.headers.host.includes('vercel.app');
    
    if (isVercel) {
        // Servir página de demo explicando limitações
        res.sendFile(path.join(__dirname, '..', 'public', 'demo.html'));
    } else {
        // Servir página normal para desenvolvimento local
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    }
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        environment: process.env.VERCEL ? 'vercel' : 'local',
        timestamp: new Date().toISOString(),
        message: 'Socket.IO não disponível na Vercel - use Railway ou Render'
    });
});

// Rota para informações da plataforma
app.get('/platform-info', (req, res) => {
    res.json({
        platform: 'Vercel',
        socketIOSupport: false,
        limitations: [
            'Funções serverless não mantêm estado',
            'WebSockets não funcionam adequadamente',
            'Timeout de 10 segundos por função',
            'Memória não compartilhada entre requisições'
        ],
        recommendations: [
            {
                name: 'Railway',
                url: 'https://railway.app',
                reason: 'Melhor suporte a WebSockets',
                free: true
            },
            {
                name: 'Render',
                url: 'https://render.com',
                reason: 'Plano gratuito com WebSockets',
                free: true
            },
            {
                name: 'Heroku',
                url: 'https://heroku.com',
                reason: 'Clássico para Node.js',
                free: false
            }
        ]
    });
});

// Rota fallback para Socket.IO (retorna erro explicativo)
app.get('/socket.io/*', (req, res) => {
    res.status(503).json({
        error: 'Socket.IO não disponível na Vercel',
        reason: 'Funções serverless não suportam WebSockets persistentes',
        solution: 'Use Railway, Render ou Heroku para funcionalidade completa'
    });
});

const PORT = process.env.PORT || 3000;

// Para desenvolvimento local, carregue o servidor completo
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    try {
        const fullServer = require('../server.js');
        console.log('🎯 Servidor completo carregado para desenvolvimento local');
    } catch (error) {
        console.log('📦 Servidor estático carregado (sem Socket.IO)');
        app.listen(PORT, () => {
            console.log(`� Servidor rodando na porta ${PORT}`);
            console.log('⚠️ Socket.IO não disponível neste modo');
        });
    }
}

// Export para Vercel
module.exports = app;
