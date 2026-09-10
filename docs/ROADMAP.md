# Roadmap MVP — GoServ

Baseado no planejamento do projeto (12 aulas · defesa 19/11).

## Onde estamos

Aula 10+: relatórios, kiosk, fotos no banco, snapshot SQL, **CI** e checklist manual do cardápio.  
Próximo: **Aulas 11–12** — testes com usuários, freeze, vídeo e defesa.

## Entregas por aula (resumo)

| Aula | Foco |
|------|------|
| **3** | CRUD produtos/categorias · 2 apps React · seed · CI build |
| **4** | Fatia vertical do cardápio · upload de foto · JWT/login admin · mesa/sessão |
| **5** | Carrinho, adicionais, notas · criar pedido no servidor · CRUD admin · testes de total |
| **6** | Painel cozinha + SignalR · status em tempo real |
| **7** | Mercado Pago sandbox · webhook · pedido só após Pix |
| **8** | Notificação “pedido pronto” · disponibilidade · MVP funcional |
| **9–11** | Segurança, relatórios, kiosk, testes com usuários |
| **12** | Freeze, vídeo do fluxo, cópia local offline |

## Fatias verticais sugeridas

Cada membro deve ter pelo menos uma fatia DB → UI:

| Fatia | Escopo |
|-------|--------|
| Cardápio | Category/MenuItem → listagem no `client` |
| Gestão | CRUD admin de produtos/categorias |
| Pedido | Carrinho → Order no servidor (total recalculado) |
| Cozinha | Status + SignalR no `admin` |
| Pagamento | Pix + webhook |

## Princípios para manter simples

- Um estabelecimento por instalação (sem SaaS).
- Client só lê cardápio / monta pedido; admin altera o cadastro.
- Preço sempre recalculado no **servidor** (nunca confiar no cliente).
- Ideias novas → backlog v2, não no MVP.
