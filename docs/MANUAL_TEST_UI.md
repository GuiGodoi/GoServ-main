# Checklist — testes manuais da reformulação visual (admin + client)

Use com o stack no ar (`npm run dev`, dentro de `GoServ-main`). Marque cada item ao validar.
Complementa o [MANUAL_TEST_MENU.md](MANUAL_TEST_MENU.md), que cobre o fluxo funcional do cardápio.

**O que mudou (resumo)**
- Design system novo nos dois apps (`styles.css` + um `.css` por tela); sem `<style>` inline nas páginas.
- Ícones SVG próprios (`Icon.jsx`), sem dependência nova.
- Admin: sidebar escura com seções, login em 2 colunas, início com KPIs, diálogos no lugar de `confirm()`/`prompt()`.
- Client: tema escuro "bistrô", cards com foto, abas fixas, bottom sheet de personalização, QR Pix real, linha do tempo do pedido.
- Toasts de erro/sucesso + `ApiError` (mensagem por status HTTP) nos dois apps.
- Dependência nova: `qrcode` no `client/` (rodar `npm install` em `client/`).

**Ambiente**
- [ ] Docker/PostgreSQL healthy (`localhost:5433`)
- [ ] API em http://localhost:5000
- [ ] Client em http://localhost:5173 (abrir também no celular ou DevTools mobile ~390px)
- [ ] Admin em http://localhost:5174
- [ ] `npm run lint` e `npm run build --prefix client` / `--prefix admin` sem erro

> O snapshot do repositório só tem os usuários. Cadastre antes: 1 categoria, 2 produtos (1 com foto),
> 1 promoção e 1 mesa, pelo próprio admin (ou restaure um snapshot com dados: `npm run db:restore`).

## Admin — navegação e login

- [ ] `/login`: tela em 2 colunas; botões "Admin"/"Cozinha" preenchem os campos
- [ ] Senha errada → toast "Não foi possível entrar · E-mail ou senha inválidos."
- [ ] Sidebar: seções Operação / Cardápio / Gestão; item ativo destacado
- [ ] Perfil **Cozinha** vê só Início, Cozinha, Mesas, QR Codes (sem Produtos/Categorias/Promoções/Relatórios)
- [ ] Largura < 860px: menu vira gaveta (botão ☰), fecha ao tocar fora ou trocar de página
- [ ] Início (Admin): KPIs de vendas/pedidos/ticket médio + atalhos; Cozinha não vê KPIs

## Admin — telas

- [ ] **Produtos**: criar, editar (rola até o formulário), excluir com diálogo, alternar disponibilidade clicando no badge
- [ ] **Produtos**: upload abre modal "Ajustar foto"; "Remover foto" pede confirmação
- [ ] **Categorias**: criar/editar/excluir; diálogo avisa que produtos ficam sem categoria
- [ ] **Promoções**: ao digitar o preço aparece "% de desconto"; status No ar / Agendada / Expirada / Inativa corretos
- [ ] **Mesas**: barra de consumo muda de cor (verde → âmbar ≥70% → vermelho ≥90%)
- [ ] **Mesas**: "Liberar teto" abre diálogo (não o `prompt()` do navegador); valor inválido → toast
- [ ] **Mesas**: campo "Adicionar" visível **só para Admin**
- [ ] **QR Codes**: senha do dia em caixas; "Gerar nova" pede confirmação; PNG baixa; impressão abre página formatada
- [ ] **Relatórios**: ranking com nome do produto, quantidade e receita; card "Pedidos por status"
- [ ] **Cozinha**: 3 colunas; ficha fica âmbar após 10 min e vermelha após 20 min; "Cancelar" pede confirmação
- [ ] **Cozinha**: nome do restaurante vem de `/api/restaurant` (não fixo); selo "Ao vivo" quando conectado

## Client — fluxo da mesa (celular)

- [ ] `/m/{idMesa}`: tela de entrada; senha errada → toast "Senha do dia inválida" (tela não troca)
- [ ] `/cardapio` (consulta): aviso "só para consulta", sem botão de adicionar
- [ ] Cardápio: abas fixas ao rolar; cards inteiros clicáveis; selo -X% em promoção; "Esgotado" esmaecido
- [ ] Produto sem foto mostra a inicial do nome (sem texto "FOTO")
- [ ] Bottom sheet: foto, adicionais selecionáveis, quantidade, total no botão; fecha com X, fora ou Esc
- [ ] Barra flutuante do carrinho com contador; some com carrinho vazio
- [ ] Carrinho: stepper (− vira lixeira em 1); "Remover"; total fixo no botão "Confirmar e pagar"
- [ ] Pagamento: **QR Pix real** (escaneável), contador de expiração, "Copiar" vira "Copiado!"
- [ ] Pagamento expirado: card esmaecido e botão de simular some
- [ ] Acompanhamento: senha grande, linha do tempo vertical, horário só no 1º passo
- [ ] Status Pronto: banner verde com sino; senha fica verde
- [ ] `?kiosk=1`: alvos de toque maiores e layout mais largo

## Toasts e erros (admin e client)

- [ ] Logar como **Cozinha** e forçar `POST /api/tables` → toast "Sem permissão · Seu perfil (Cozinha)…"
- [ ] Derrubar a API (parar o backend) e clicar em qualquer ação → toast "Sem conexão"
- [ ] Mesma mensagem repetida não empilha vários toasts
- [ ] Toast some sozinho (~6 s erro / ~3 s sucesso) e pausa com o mouse em cima
- [ ] QR Codes e Relatórios com API fora do ar → mensagem na tela (não ficam em branco)
- [ ] Token de mesa inválido em `/mesa/xyz` → tela de erro cheia (não tela branca)

## Regressões rápidas

- [ ] Recarregar o cardápio não perde a sessão da mesa
- [ ] Admin continua autenticado após refresh
- [ ] Modo escuro/claro do sistema não quebra contraste (admin é claro, client é escuro por design)
- [ ] Nenhum erro vermelho no console do navegador (404 de favicon é esperado)

Registrar falhas com: URL, passos, esperado vs obtido, print se possível.
