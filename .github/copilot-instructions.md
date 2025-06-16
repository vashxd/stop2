<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Adedonha Online - Instruções para Copilot

Este é um projeto de jogo Adedonha/Stop online em tempo real desenvolvido com:

## Tecnologias
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Comunicação**: WebSockets para tempo real
- **Armazenamento**: Dados em memória (sem banco de dados)

## Estrutura do Projeto
- `server.js` - Servidor principal com lógica do jogo
- `public/` - Arquivos estáticos do frontend
  - `index.html` - Interface principal
  - `styles.css` - Estilos modernos e responsivos
  - `script.js` - Lógica do cliente

## Funcionalidades Implementadas
- ✅ Sistema de salas públicas e privadas
- ✅ Criação e busca de salas
- ✅ Sistema de host com controles especiais
- ✅ Categorias padrão + categorias personalizadas
- ✅ Fase de escrita com timer automático
- ✅ Sistema de votação para validar respostas
- ✅ Pontuação automática (10 pts únicos, 5 pts repetidos)
- ✅ Ranking final com classificação
- ✅ Interface responsiva e moderna
- ✅ Notificações em tempo real

## Regras do Jogo
1. Mínimo 2 jogadores para iniciar
2. Host pode adicionar/remover categorias
3. Letra sorteada aleatoriamente (sem repetir)
4. Todos devem responder antes do STOP
5. Votação para validar cada resposta
6. Pontuação: 10 pts (única), 5 pts (repetida), 0 pts (inválida)
7. Ranking final por pontuação total

## Para Desenvolvimento
- Use `npm start` para rodar o servidor
- Servidor roda na porta 3000 por padrão
- Socket.IO gerencia conexões em tempo real
- Todos os dados ficam em memória (Map objects)
- Interface moderna com animações CSS
