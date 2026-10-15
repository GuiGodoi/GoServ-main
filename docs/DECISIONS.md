# Decisões de arquitetura — GoServ

Registro breve das escolhas técnicas do MVP (disciplina · 2026).

## Duas apps React, um backend

| App | Motivo |
|-----|--------|
| `client/` | Público (QR / kiosk). Sem login. |
| `admin/` | Interno (cozinha + gestão) atrás de JWT e papéis. |

Evita misturar UX e segurança do cliente com o painel da equipe. O modo **kiosk** reutiliza o `client` (`?kiosk=1`), sem app nativo.

## Camadas no backend

`Controller → Service → Repository` — regra da disciplina e facilita testes das regras (totais, status, sanitização) sem HTTP.

## Tempo real com SignalR (sem Redis)

- `/hubs/kitchen` — equipe autenticada  
- `/hubs/orders` — cliente anônimo acompanha o próprio pedido (`WatchOrder`)

PostgreSQL + SignalR in-process bastam para um estabelecimento (fora de escopo: cache distribuído).

## Preço sempre no servidor

O cliente pode enviar `clientUnitPrice`, mas o total usa só preços do banco (RNF06).

## UUID público vs id interno

- `Order.Id` (int) — número da fila na cozinha  
- `Order.PublicId` (GUID) — URL do cliente (`/pedido/{uuid}`), não enumerável  

## Pix no fluxo do cliente (wireframe T4)

Pedidos nascem em `AwaitingPayment` e **só entram na cozinha** após
`POST /api/orders/public/{uuid}/confirm-payment` (simula webhook do provedor).
A tela do client mostra QR/código e estado “Aguardando confirmação”.
Integração real Mercado Pago continua opcional para a aula 7.

## Relatórios

Agregações diárias em UTC sobre pedidos **já pagos** (exclui `AwaitingPayment` e cancelados).
Fuso do estabelecimento pode ser parametrizado depois.

## Visual e tratamento de erros no front

- **CSS**: tokens e componentes base em `styles.css` de cada app; estilo de tela em `*.css` ao lado do componente.
  Nada de `<style>` inline com seletores globais (`h1`, `input`, `button`), que causava botões diferentes por tela.
- **Ícones**: SVG próprios em `Icon.jsx` (sem biblioteca de ícones).
- **Erros de API**: `request()` lança `ApiError` (status + título + mensagem em pt-BR por código HTTP;
  `fetch` sem resposta vira "Sem conexão"). Mensagem do backend (`{ message }`) tem prioridade.
- **Toasts** (`useToast()`): ação do usuário que falha vira toast; erro que impede a tela de existir
  (mesa/pedido inválido) continua tela cheia. Promise rejeitada com `ApiError` sem `catch` também vira toast.
- **Confirmações no admin**: `useDialog().confirm/prompt` no lugar de `confirm()`/`prompt()` nativos.
- **Permissão na UI**: a interface esconde ações que o perfil não pode fazer (ex.: cadastrar mesa só para
  Admin), mas a autorização de verdade continua no backend (403).
