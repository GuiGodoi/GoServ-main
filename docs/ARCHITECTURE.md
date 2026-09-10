# Arquitetura — GoServ

Sistema de autoatendimento e gestão para restaurantes/lanches (MVP, um estabelecimento por instalação).

## Visão geral

```
Cliente (QR / kiosk)          Equipe (cozinha + admin)
  client :5173                  admin :5174
       │                              │
       ├──────── /api/* ──────────────┤
       │                              │
       │                    /hubs/kitchen (SignalR)
       │                              │
       └──────────────┬───────────────┘
                      ▼
              backend :5000
           (ASP.NET Core 8)
                      │
                      ▼
              PostgreSQL :5433
```

São **duas aplicações React** (não três):

| App | Pasta | Quem usa | Auth |
|-----|--------|----------|------|
| **Client** | `client/` | Cliente via QR ou tablet em modo kiosk | Público |
| **Admin** | `admin/` | Cozinha + administração (conteúdo por perfil) | Login obrigatório |

## Backend — camadas obrigatórias

```
Controller  →  recebe a requisição HTTP
Service     →  regras de negócio
Repository  →  acesso ao banco (EF Core)
```

```
backend/
├── Controllers/
├── Services/
├── Repositories/
├── Models/
├── Dtos/
├── Data/           # DbContext + seed
└── Migrations/
```

Identificadores de código em **inglês**; comentários e commits em **português**.

## Domínio do MVP (escopo simples)

Fluxo principal:

1. Cliente escaneia QR → vê cardápio (foto, descrição, categoria, preço, disponibilidade)
2. Monta pedido (qtd, adicionais, observação) → paga Pix (Mercado Pago)
3. Pagamento confirmado → pedido aparece na cozinha em tempo real (SignalR)
4. Cozinha atualiza status: recebido → em preparo → pronto → entregue
5. Admin cadastra/edita produtos, categorias, preços, fotos e disponibilidade
6. Relatórios diários (vendas, mais vendidos, ticket médio)

**Fora do MVP:** offline, Redis, apps nativos, NFC-e, multi-tenant, delivery, fidelidade, maquininha.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Client / Admin | React + Vite |
| API | C# .NET 8 / ASP.NET Core |
| Banco | PostgreSQL + EF Core |
| Tempo real | SignalR — `/hubs/kitchen` (equipe) e `/hubs/orders` (cliente) |
| Pagamento | Mercado Pago Pix (Aula 7; fallback QR estático) |

## Como subir

Na raiz: `npm run setup` e depois `npm run dev` (ver README).

| Serviço | URL |
|---------|-----|
| Client (cardápio) | http://localhost:5173 |
| Admin (gestão) | http://localhost:5174 |
| API | http://localhost:5000 |
| PostgreSQL | localhost:5433 |
