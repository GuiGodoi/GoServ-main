# Registro de mudanças feitas por IA

> **Regra obrigatória** (definida em [`AGENTS.md`](../AGENTS.md)): toda mudança no repositório ou no ambiente local
> feita por **qualquer IA** vira uma entrada nova **no topo** deste arquivo, antes do commit. Sem entrada, a tarefa
> não está concluída. O CI reprova PR com commits de IA que não alterem este arquivo.

**Formato do registro:** 1.0 · **Última entrada:** AI-0005

## Como versionar

- **Cada entrada é uma versão** do histórico: ID sequencial `AI-NNNN` (4 dígitos, nunca reutilizado).
- A **ordem é da mais nova para a mais antiga** (o maior ID fica no topo).
- O **git versiona o arquivo**: o campo `Commit` aponta o commit onde a mudança entrou. Preencha-o depois de commitar
  (é a única edição permitida em entrada antiga). `pendente` = ainda não commitada.
- Mudou o **formato** deste registro? Aumente o "Formato" acima (1.0 → 1.1 compatível, 2.0 incompatível) e explique
  numa entrada nova.
- Mensagem de commit cita o ID: `feat(admin): toasts de erro (AI-0003)`. O CI confere se o ID existe aqui.
- Correção de algo registrado antes = **entrada nova** que cita a antiga (`Corrige AI-0003`), sem apagar a original.

## Modelo de entrada

```markdown
## AI-NNNN · AAAA-MM-DD · Título curto
- **IA:** ferramenta — modelo (ex.: Claude Code — Claude Opus 5.5)
- **Pedido:** o que a pessoa pediu, em uma frase
- **Resumo:** o que foi feito e por quê
- **Arquivos:** pastas/arquivos principais afetados (ou "ambiente local" se não mexeu no repositório)
- **Validação:** o que foi realmente rodado/verificado e como
- **Não testado / riscos:** o que ficou sem verificação, pendências, efeitos colaterais
- **Commit:** pendente | hash(es)
```

---

## AI-0005 · 2026-10-15 · Registro obrigatório de mudanças por IA
- **IA:** Claude Code — Claude Sonnet 5.5
- **Pedido:** criar um histórico de mudanças feitas por qualquer IA, como regra obrigatória do repositório, para não
  perder o registro a cada sessão, e versionado.
- **Resumo:** este arquivo (com formato e regra de versionamento); `AGENTS.md` com a regra para qualquer ferramenta;
  `CLAUDE.md` (importa o `AGENTS.md`) e `.github/copilot-instructions.md` para as ferramentas que não leem
  `AGENTS.md`; `scripts/check-ai-changelog.sh` + job `ai-changelog` no CI para reprovar PR com commit de IA sem
  entrada no registro, ID citado inexistente ou registro fora de ordem; `.gitattributes` forçando LF em `*.sh`
  (o repositório usa CRLF, que quebraria o bash no CI); link no README.
- **Arquivos:** `docs/AI_CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`,
  `.github/workflows/ci.yml`, `scripts/check-ai-changelog.sh`, `.gitattributes`, `README.md`.
- **Validação:** `bash -n` no script e execução em repositório temporário com 7 cenários, todos com o resultado
  esperado: commit humano (passa), commit de IA sem alterar o registro (falha), commit de IA com registro e ID
  existente (passa), ID citado inexistente (falha), registro fora de ordem (falha), registro em CRLF com trailer do
  Copilot (passa) e "Generated with Claude Code" sem registro (falha).
- **Não testado / riscos:** o job do GitHub Actions em si não foi executado (só a lógica do script, localmente).
  O CI só enxerga IA que deixa rastro na mensagem do commit (trailer `Co-Authored-By`, "Generated with…" ou ID
  `AI-NNNN`); IA que não deixa rastro depende de seguir o `AGENTS.md`. Push direto na `main` não passa pelo job
  (só pull requests). Não há registro retroativo anterior ao AI-0001: os commits `6dda690` e `3598d18` não têm
  autoria de IA documentada, nem confirmação de que não houve.
- **Commit:** 57d7ff1

## AI-0004 · 2026-10-15 · Checklist de testes da UI e decisões registradas
- **IA:** Claude Code — Claude Sonnet 5.5
- **Pedido:** resumo das últimas alterações de IA e onde testar/registrar.
- **Resumo:** checklist manual da reformulação visual e dos toasts (~50 itens, no formato do
  `MANUAL_TEST_MENU.md`) e seção "Visual e tratamento de erros no front" em `DECISIONS.md`.
- **Arquivos:** `docs/MANUAL_TEST_UI.md` (novo), `docs/DECISIONS.md`.
- **Validação:** conferido contra o código e os comportamentos observados nas telas durante AI-0001 e AI-0003.
- **Não testado / riscos:** o checklist não foi executado por uma pessoa; os itens dependem de dados cadastrados
  (categoria, produtos com foto, promoção, mesa), pois o snapshot do banco só tem os usuários.
- **Commit:** 57d7ff1

## AI-0003 · 2026-10-15 · Toasts de erro e `ApiError` (admin e client)
- **IA:** Claude Code — Claude Opus 5.5
- **Pedido:** entender o erro 403 ao cadastrar mesa e criar toasts de erro nos dois apps para esse tipo de erro e
  outros.
- **Resumo:** causa do 403: perfil **Cozinha** chamando `POST /api/tables`, que é só do Admin, e a tela oferecia o
  formulário a todos. Agora o formulário só aparece para Admin. Novo `ApiError` (status + título + mensagem em pt-BR
  por código HTTP; falha de rede vira "Sem conexão"; mensagem do backend tem prioridade) usado por `request()` nos
  dois apps. `ToastProvider`/`useToast()` nos dois apps (admin: canto inferior; client: topo), com deduplicação,
  pausa ao passar o mouse e captura de promise rejeitada sem `catch`. Todas as telas migradas de faixa de erro
  inline para toast; QR Codes e Relatórios ganharam estado de erro (antes ficavam em branco); em pagamento e
  acompanhamento, falha só do tempo real não derruba mais a tela.
- **Arquivos:** `admin/src/services/{apiError.js,api.js}`, `admin/src/components/ui/{Toast.jsx,index.js}`,
  `admin/src/{App.jsx,styles.css}`, `admin/src/pages/*`; `client/src/services/{apiError.js,api.js}`,
  `client/src/components/{Toast.jsx,Toast.css,CustomizeModal.jsx}`, `client/src/App.jsx`,
  `client/src/pages/{CartPage,TableGatePage,OrderStatusPage,PaymentPage}.jsx`.
- **Validação:** `eslint` e `vite build` nos dois apps. Contra o **backend real**: login com senha errada (toast),
  Cozinha tentando `POST /api/tables` (toast "Sem permissão · Seu perfil (Cozinha)…", formulário oculto) e senha do
  dia errada no client (toast "Senha do dia inválida"), com screenshots.
- **Não testado / riscos:** toast de "Sem conexão" (API parada), telas de erro de QR Codes/Relatórios, falha do
  SignalR em pagamento/acompanhamento e o erro de adicionais no modal foram apenas revisados no código.
  Corrige comportamento de AI-0001 (erros inline), sem desfazê-lo.
- **Commit:** 6ab67cd

## AI-0002 · 2026-10-15 · Ambiente local: banco e stack de desenvolvimento
- **IA:** Claude Code — Claude Opus 5.5
- **Pedido:** colocar o projeto para rodar (`npm run dev` falhou por rodar na pasta errada).
- **Resumo:** abriu o Docker Desktop, criou o container e o volume do PostgreSQL com `npm run db:restore` (o banco
  não existia nesta máquina) e subiu backend, client e admin com `npm run dev`. Nenhum arquivo do repositório foi
  alterado nesta etapa. Descoberta: `backend/db/snapshot.sql` contém apenas os 2 usuários de login; o commit
  "up: banco com produtos" não trouxe produtos, categorias nem mesas.
- **Arquivos:** ambiente local (Docker: container `goserv-db`, volume do Postgres; 3 janelas de PowerShell
  minimizadas com backend/client/admin).
- **Validação:** `/api/restaurant` respondeu; client e admin responderam 200; consulta ao banco confirmou 13 tabelas
  e 0 produtos/categorias/mesas.
- **Não testado / riscos:** o cardápio nasce vazio até cadastrar dados ou restaurar um snapshot com dados
  (`npm run db:export` na máquina de quem tem os produtos).
- **Commit:** não se aplica (sem mudança no repositório)

## AI-0001 · 2026-10-15 · Reformulação visual do admin e do client
- **IA:** Claude Code — Claude Opus 5.5
- **Pedido:** melhorar o front e deixá-lo mais bonito, com menos cara de HTML cru.
- **Resumo:** design system em cada app (`styles.css` com tokens e componentes; um `.css` por tela no lugar de
  `<style>` inline com seletores globais) e ícones SVG próprios (`Icon.jsx`). **Admin:** sidebar escura por seções
  com gaveta no celular, login em 2 colunas, início com KPIs e atalhos, tabelas com ações em ícone, barra de
  consumo nas mesas, quadro da cozinha com cores de atraso (10/20 min), ranking nos relatórios, QR Codes com senha
  do dia em destaque, e `useDialog()` no lugar de `confirm()`/`prompt()`. **Client:** tema escuro, cards com foto,
  abas fixas, modal de personalização em bottom sheet, barra flutuante do carrinho, QR Pix real (dependência nova
  `qrcode`) e linha do tempo do pedido. Ajustes de comportamento: nome do restaurante na cozinha vem de
  `/api/restaurant` (era fixo "Lanchonete do Zé"); promoção "Agendada" separada de "Expirada"; horário da linha do
  tempo só no 1º passo (o backend só envia a hora de criação); `main.jsx` passou a importar o CSS global antes do
  `App`.
- **Arquivos:** `admin/src/**` (App, estilos, `components/ui/*`, `pages/*`, `services/api.js`),
  `client/src/**` (estilos, `components/*`, `pages/*`), `client/package.json` e `client/package-lock.json`
  (`qrcode`).
- **Validação:** `eslint` e `vite build` nos dois apps; screenshots de todas as telas (desktop no admin, 390px no
  client) usando uma **API simulada** com dados de exemplo.
- **Não testado / riscos:** não foi validado com o backend real e dados reais (principalmente produtos **com foto**).
  Incidente: um `npm install` rodado na pasta errada adicionou `"goserv": "file:.."` aos `package.json`; foi
  revertido (`git checkout` dos manifestos) e só `qrcode` foi reinstalado no client. Rodar `npm install` em
  `client/` ao atualizar.
- **Commit:** 6ab67cd

---

## Histórico anterior ao registro

Não há registro retroativo. Commits anteriores ao AI-0001 (`6dda690`, `3598d18`) não têm autoria de IA documentada.
