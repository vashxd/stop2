# 🎯 Deploy do Adedonha Online

## Opções de Deploy (Recomendadas)

### 1. 🚂 Railway (Recomendado para WebSockets)
- **Vantagens**: Suporte completo ao Socket.IO, fácil deploy
- **Deploy**: 
  1. Conecte o GitHub ao Railway
  2. Faça o deploy direto
  3. Configure apenas a variável `PORT`

### 2. 🌐 Render
- **Vantagens**: Plano gratuito, suporte a WebSockets
- **Deploy**:
  1. Conecte o GitHub ao Render
  2. Configure Web Service
  3. Build Command: `npm install`
  4. Start Command: `npm start`

### 3. ⚡ Vercel (Limitações)
- **Configurado neste projeto**
- **Limitações**: Socket.IO pode ter problemas de conexão persistente
- **Uso**: Melhor para testes, pode não funcionar perfeitamente em produção

## Instruções de Deploy - Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha seu repositório
6. Configure:
   - **Service Name**: adedonha-online
   - **Environment Variables**: (nenhuma necessária)
7. Deploy automático!

## Instruções de Deploy - Render

1. Acesse [render.com](https://render.com)
2. Conecte sua conta GitHub
3. Clique em "New Web Service"
4. Selecione seu repositório
5. Configure:
   - **Name**: adedonha-online
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Deploy!

## Testando Local

```bash
npm install
npm start
```

Acesse: http://localhost:3000
