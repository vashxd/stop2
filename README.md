# 🎯 Adedonha Online

Um jogo Adedonha (Stop) online em tempo real, desenvolvido com Node.js, Express e Socket.IO.

## � Deploy na Vercel

Este projeto está configurado para deploy no **Vercel** usando o plano gratuito.

### Configurações para Deploy

1. **Faça push do projeto para GitHub**
2. **Na Vercel**:
   - Conecte sua conta GitHub
   - Importe o repositório
   - Configure as seguintes opções:

   **Build & Development Settings:**
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: (deixe vazio)
   - Install Command: `npm install`
   - Development Command: `npm run dev`

   **Environment Variables:**
   - `NODE_ENV` = `production`

3. **Deploy automático**: A Vercel fará o deploy automaticamente

### ⚠️ Limitações do Plano Gratuito da Vercel

- **Funções Serverless**: O Socket.IO pode ter limitações de conexão persistente
- **Timeout**: Máximo 10 segundos por função
- **Memória**: 1024 MB por função
- **Bandwidth**: 100 GB/mês

Para melhor performance com Socket.IO, considere:
- **Railway** (recomendado para WebSockets)
- **Heroku** 
- **Render**
- **DigitalOcean App Platform**

## �🎮 Como Jogar

### Regras do Adedonha
1. **Objetivo**: Preencher categorias com palavras que começam com uma letra sorteada
2. **Mínimo**: 2 jogadores para iniciar
3. **Pontuação**:
   - 10 pontos: Resposta única (só você respondeu)
   - 5 pontos: Resposta repetida (outros também responderam igual)
   - 0 pontos: Resposta inválida ou em branco

### Fases do Jogo
1. **Preparação**: Host configura a sala e categorias
2. **Escrita**: Todos preenchem as categorias com a letra sorteada
3. **Votação**: Jogadores votam se as respostas são válidas
4. **Pontuação**: Sistema calcula pontos automaticamente
5. **Ranking**: Exibe classificação final

## 🚀 Como Usar

### Criar uma Sala
1. Digite seu nickname
2. Clique em "Criar Sala"
3. Escolha o nome da sala
4. Marque "Sala privada" se desejar (opcional)
5. Compartilhe o código com amigos (salas privadas)

### Entrar em uma Sala
1. Digite seu nickname
2. Clique em "Encontrar Sala"
3. **Salas Públicas**: Aparecerão automaticamente na lista
4. **Salas Privadas**: Digite o código da sala

### Durante o Jogo
- **Host**: Pode adicionar/remover categorias e controlar o jogo
- **Jogadores**: Preenchem respostas e participam da votação
- **Todos**: Veem pontuação em tempo real

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Instalação
```bash
# Clone ou baixe o projeto
cd adedonha-online

# Instale as dependências
npm install

# Execute o servidor
npm start
```

### Acesso
- Abra o navegador em: `http://localhost:3000`
- Para jogar em rede local, outros dispositivos podem acessar: `http://SEU_IP:3000`

## 🔧 Tecnologias Utilizadas

- **Backend**: Node.js + Express
- **WebSockets**: Socket.IO para comunicação em tempo real
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Armazenamento**: Dados em memória (sem banco de dados)

## 📱 Características

### ✅ Funcionalidades Implementadas
- Sistema completo de salas públicas e privadas
- Interface moderna e responsiva
- Comunicação em tempo real
- Sistema de votação para validar respostas
- Pontuação automática
- Ranking com classificação
- Categorias personalizáveis
- Controles de host avançados

### 🎨 Interface
- Design moderno com gradientes
- Responsivo para mobile e desktop
- Animações suaves
- Notificações em tempo real
- Scoreboard flutuante durante o jogo

### 🔒 Recursos de Sala
- **Salas Públicas**: Visíveis para todos
- **Salas Privadas**: Acessíveis apenas por código
- **Host Controls**: Adicionar categorias, iniciar jogo, próxima rodada
- **Auto-transfer**: Host transferido automaticamente se o atual sair

## 📋 Lista de Categorias Padrão

1. Nome próprio
2. Animal
3. Objeto
4. Cor
5. Comida
6. País/Cidade
7. Profissão

*O host pode adicionar quantas categorias personalizadas quiser!*

## 🎯 Como o Sistema de Pontuação Funciona

1. **Fase de Votação**: Cada resposta é votada pelos outros jogadores
2. **Validação**: Resposta é válida se receber maioria de votos positivos
3. **Cálculo de Pontos**:
   - Se válida + única = 10 pontos
   - Se válida + repetida = 5 pontos
   - Se inválida = 0 pontos
4. **Ranking**: Jogadores ordenados por pontuação total

## 🌐 Recursos de Rede

- **Tempo Real**: Todas as ações sincronizadas instantaneamente
- **Reconexão**: Jogadores podem voltar se desconectarem
- **Cleanup**: Salas vazias são removidas automaticamente
- **Transfer Host**: Novo host escolhido se o atual sair

## 🔧 Configurações Avançadas

### Variáveis de Ambiente
- `PORT`: Porta do servidor (padrão: 3000)

### Customizações Possíveis
- Modificar letras disponíveis no array `ALPHABET` (server.js)
- Adicionar novas categorias padrão em `DEFAULT_CATEGORIES`
- Ajustar limite de jogadores por sala
- Modificar tempo de espera entre fases

## 🐛 Troubleshooting

### Problemas Comuns
1. **Erro de conexão**: Verifique se o servidor está rodando
2. **Sala não encontrada**: Código pode ter expirado ou sala foi fechada
3. **Não consigo votar**: Aguarde sua vez na fila de votação
4. **Botão STOP desabilitado**: Nem todos os jogadores responderam ainda

### Logs
O servidor exibe logs úteis no console para debugar problemas.

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `package.json` para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades  
- Melhorar a interface
- Otimizar o código

---

**Divirta-se jogando Adedonha Online! 🎉**
