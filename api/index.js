const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware para logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware para tratar JSON
app.use(express.json());

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Rota principal - página HTML simples
app.get('/', (req, res) => {
    try {
        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adedonha Online - Demo Vercel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { background: white; padding: 2rem; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 600px; width: 90%; }
        h1 { color: #333; margin-bottom: 1rem; font-size: 2.5rem; }
        .status { padding: 1rem; margin: 1rem 0; border-radius: 10px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .btn { display: inline-block; padding: 12px 24px; margin: 10px; background: #667eea; color: white; text-decoration: none; border-radius: 25px; font-weight: bold; transition: all 0.3s; }
        .btn:hover { background: #5a6fd8; transform: translateY(-2px); }
        .info { margin: 1rem 0; padding: 1rem; background: #e7f3ff; border-radius: 10px; }
        .limitations { text-align: left; margin: 1rem 0; }
        .limitations li { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Adedonha Online</h1>
        <div class="status success">
            <strong>✅ API Funcionando na Vercel!</strong><br>
            Conexão estabelecida com sucesso
        </div>
        
        <div class="status warning">
            <strong>⚠️ Funcionalidade Limitada</strong><br>
            O jogo completo não funciona na Vercel devido às limitações de WebSockets
        </div>

        <div class="info">
            <h3>🔧 Status da Plataforma</h3>
            <p><strong>Plataforma:</strong> Vercel (Serverless)</p>
            <p><strong>Socket.IO:</strong> ❌ Não suportado</p>
            <p><strong>Tempo:</strong> <span id="timestamp">${new Date().toLocaleString('pt-BR')}</span></p>
        </div>

        <div class="limitations">
            <h3>📋 Limitações da Vercel:</h3>
            <ul>
                <li>Funções serverless não mantêm estado</li>
                <li>WebSockets não funcionam adequadamente</li>
                <li>Timeout de 10 segundos por função</li>
                <li>Memória não compartilhada entre requisições</li>
            </ul>
        </div>

        <div style="margin-top: 2rem;">
            <h3>🚀 Plataformas Recomendadas:</h3>
            <a href="https://railway.app" class="btn" target="_blank">Railway (Grátis)</a>
            <a href="https://render.com" class="btn" target="_blank">Render (Grátis)</a>
            <a href="#" class="btn" onclick="testAPI()">Testar API</a>
        </div>

        <div id="test-result" style="margin-top: 1rem;"></div>
    </div>

    <script>
        function testAPI() {
            const resultDiv = document.getElementById('test-result');
            resultDiv.innerHTML = '<div class="status warning">Testando API...</div>';
            
            fetch('/api/test')
                .then(response => response.json())
                .then(data => {
                    resultDiv.innerHTML = \`
                        <div class="status success">
                            <strong>✅ Teste da API Passou!</strong><br>
                            Mensagem: \${data.message}<br>
                            Hora: \${new Date(data.timestamp).toLocaleString('pt-BR')}
                        </div>
                    \`;
                })
                .catch(error => {
                    resultDiv.innerHTML = \`
                        <div class="status error">
                            <strong>❌ Erro no Teste da API</strong><br>
                            \${error.message}
                        </div>
                    \`;
                });
        }

        // Atualizar timestamp a cada segundo
        setInterval(() => {
            document.getElementById('timestamp').textContent = new Date().toLocaleString('pt-BR');
        }, 1000);
    </script>
</body>
</html>
        `;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        console.error('Erro ao servir página principal:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        environment: 'vercel',
        timestamp: new Date().toISOString(),
        message: 'Servidor funcionando - Socket.IO não disponível na Vercel'
    });
});

// Rota para informações da plataforma
app.get('/api/platform-info', (req, res) => {
    res.json({
        platform: 'Vercel',
        socketIOSupport: false,
        status: 'running',
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
                reason: 'Clássico para Node.js - agora pago',
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

// Rota para teste de conectividade
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API funcionando',
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent') || 'Não informado'
    });
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Algo deu errado',
        timestamp: new Date().toISOString()
    });
});

// Rota 404 para todas as outras rotas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Export para Vercel
module.exports = app;
