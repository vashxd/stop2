# Adedonha Online - Configuração para Vercel

## ⚠️ AVISO IMPORTANTE

A **Vercel** tem limitações para aplicações com Socket.IO devido ao modelo de funções serverless. 

### Problemas Esperados:
- Conexões WebSocket podem falhar
- Sessões não persistem entre requisições
- Timeout de 10 segundos por função

## 🎯 Alternativas Recomendadas

### 1. Railway (Melhor opção)
```bash
# Faça push para GitHub, depois:
# 1. Acesse railway.app
# 2. Conecte GitHub
# 3. Deploy automático
```

### 2. Render
```bash
# Configurações no Render:
# Build Command: npm install
# Start Command: npm start
# Environment: Node
```

## 🚀 Deploy na Vercel (Experimental)

Se ainda quiser tentar na Vercel:

1. **Push para GitHub**
2. **Import no Vercel**
3. **Configurações**:
   - Framework: Other
   - Build Command: `npm run build` 
   - Development Command: `npm run dev`
   - Environment Variables:
     - `NODE_ENV` = `production`

### Comando de Deploy Local (Vercel CLI)
```bash
npm i -g vercel
vercel login
vercel --prod
```

## ⚡ Testando Local
```bash
npm start
# Acesse: http://localhost:3000
```
