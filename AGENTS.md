# Regras para IAs neste repositório

Vale para **qualquer** IA, agente ou assistente de código (Claude Code, GitHub Copilot, Cursor, Codex/ChatGPT,
Gemini, Aider, etc.). Pessoas também devem seguir a regra ao usar uma IA para alterar o projeto.

## Regra obrigatória: registrar toda mudança em `docs/AI_CHANGELOG.md`

1. **Ao começar** uma sessão, leia as últimas entradas de [`docs/AI_CHANGELOG.md`](docs/AI_CHANGELOG.md). É a memória
   do que já foi feito por IA, porque o contexto de cada sessão se perde.
2. **Antes de encerrar** a tarefa (e antes de qualquer commit), adicione **uma entrada nova no topo** do arquivo.
   Vale para qualquer mudança em arquivos do repositório **ou no ambiente local do projeto** (banco, containers,
   dependências), inclusive mudança só de documentação. **Sem entrada, a tarefa não está concluída.**
3. Use o próximo ID sequencial (`AI-NNNN`) e o formato descrito no cabeçalho do próprio arquivo.
4. **Nunca edite nem apague entradas antigas.** Para corrigir algo, crie uma entrada nova que cite a antiga. A única
   exceção é preencher o campo `Commit` depois de commitar.
5. **Registre com honestidade** o que foi testado e o que **não** foi. Não escreva "funciona" sem ter verificado.
6. **Nunca registre segredos**: senhas, tokens, chaves, connection strings.
7. **Commit:** inclua o ID na mensagem (ex.: `feat(admin): toasts de erro (AI-0003)`) e o trailer `Co-Authored-By`
   da ferramenta. O CI (`scripts/check-ai-changelog.sh`) reprova PR com sinal de IA nos commits sem alteração no
   registro, ou que cite um ID inexistente.

## Contexto rápido

- A raiz do projeto é a pasta `GoServ-main`. Rode `npm`, `dotnet` e `git` a partir dela.
- Subir tudo: `npm run dev` (precisa do Docker Desktop aberto). Parar o banco: `npm run stop`.
- Antes de entregar: `npm run lint` e `npm run build --prefix client` / `--prefix admin`; backend: `npm test`.
- Dois apps React: `client/` (cardápio, tema escuro) e `admin/` (painel, tema claro); backend ASP.NET Core 8 em `backend/`.
- Convenções de front: comentários em português explicando o **porquê**; CSS ao lado do componente (sem `<style>`
  inline); erros de ação do usuário via `useToast()`; confirmações no admin via `useDialog()`.
- A interface pode esconder ações que o perfil não pode fazer, mas **a autorização de verdade é do backend**.
- Checklists de teste manual: `docs/MANUAL_TEST_*.md`. Decisões técnicas: `docs/DECISIONS.md`.
