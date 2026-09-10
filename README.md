# GoServ

Autoatendimento e gestão para restaurantes (projeto de faculdade). Monorepo:

| Parte | Tecnologia | Pasta / URL |
|--------|------------|-------------|
| **Client** (cardápio QR / kiosk) | React + Vite | `client/` → http://localhost:5173 |
| **Admin** (gestão + cozinha) | React + Vite | `admin/` → http://localhost:5174 |
| **Backend** | C# / ASP.NET Core 8 | `backend/` → http://localhost:5000 |
| **Banco** | PostgreSQL 15 | Docker (`docker-compose.yml`) |

---

## O que você precisa instalar (uma vez)

| Ferramenta | Para quê | Download |
|------------|----------|----------|
| **Git** | Clonar e versionar | https://git-scm.com/downloads |
| **Node.js LTS** (18+) | Frontends React | https://nodejs.org/ |
| **.NET 8 SDK** | Backend | https://dotnet.microsoft.com/download/dotnet/8.0 |
| **Docker Desktop** | PostgreSQL | https://www.docker.com/products/docker-desktop/ |

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install Microsoft.DotNet.SDK.8
winget install Docker.DockerDesktop
```

Abra o Docker Desktop e espere ficar “Running”.

---

## Subir o projeto

```powershell
npm run setup   # primeira vez
npm run dev     # banco + API + client + admin
```

| App | URL |
|-----|-----|
| Cardápio (consulta) | http://localhost:5173/cardapio |
| Mesa (QR + senha) | http://localhost:5173/m/{idMesa} |
| Admin | http://localhost:5174 |
| API | http://localhost:5000 |

Atalho: **Ctrl+Shift+B** (task `GoServ: Dev`).

Parar o banco: `npm run stop`

---

## Estrutura

```
GoServ/
├── client/                   # App do cliente (QR / kiosk)
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── cart/
│       ├── hooks/
│       ├── services/         # Chamadas HTTP / SignalR
│       └── utils/            # Funções reutilizáveis (preço, data…)
├── admin/                    # App interno (gestão + cozinha)
│   └── src/
│       ├── pages/
│       ├── components/
│       │   └── ui/           # Select, Checkbox, ImageUpload…
│       ├── auth/
│       ├── services/
│       └── utils/            # Funções reutilizáveis (preço, data, crop…)
├── backend/
│   ├── Controllers/          # HTTP
│   ├── Services/             # Regras de negócio
│   ├── Repositories/         # Banco
│   ├── Models/
│   ├── Dtos/
│   ├── Data/                 # DbContext + seed
│   ├── db/                   # Snapshot PostgreSQL compartilhado
│   └── Migrations/
├── docs/
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
├── scripts/
├── docker-compose.yml
└── package.json
```

Padrão do backend: **Controller → Service → Repository**.  
Frontends: lógica de tela em `pages/`; HTTP em `services/`; helpers compartilhados em `utils/` (um lugar só para manutenção).  
Identificadores em inglês; comentários/commits em português.

---

## Fluxo simples (MVP)

1. Admin cadastra categorias, produtos (com foto), promoções e mesas
2. Cliente escaneia QR da mesa → nome + senha do dia → cardápio / pedido / Pix
3. Após pagamento (simulado), o pedido aparece na **Cozinha** em tempo real (SignalR)

---

## API atual

| Método | URL | Descrição |
|--------|-----|-----------|
| GET | `/api/health` | Status |
| POST | `/api/auth/login` | Login JWT |
| GET | `/api/auth/me` | Usuário logado |
| GET/POST/PUT/DELETE | `/api/categories` | CRUD (escrita = Admin) |
| GET/POST/PUT/DELETE | `/api/menuitems` | CRUD (escrita = Admin) |
| GET | `/api/menuitems?availableOnly=true` | Cardápio público |
| GET/POST/DELETE | `/api/menuitems/{id}/photo` | Foto JPEG no banco |
| GET/POST/PUT/DELETE | `/api/promotions` | Promoções (escrita = Admin) |
| GET/POST | `/api/tables` | Mesas (auth) |
| POST | `/api/tables/{id}/sessions` | Abrir sessão / QR |
| GET | `/api/orders/addons/{menuItemId}` | Adicionais do produto |
| POST | `/api/orders` | Criar pedido (`AwaitingPayment`) |
| POST | `/api/orders/public/{uuid}/confirm-payment` | Simula webhook Pix → cozinha |
| GET | `/api/qr` | Catálogo de links + senha do dia (auth) |
| POST | `/api/qr/day-passcode/rotate` | Nova senha do dia |
| GET | `/api/tables/{id}/public` | Dados públicos da mesa |
| POST | `/api/tables/{id}/join` | Liberar mesa (nome + senha do dia) |
| GET | `/api/orders/{id}` | Detalhe do pedido |
| GET | `/api/orders` | Lista (Admin/Kitchen) |
| PATCH | `/api/orders/{id}/status` | Atualizar status (cozinha) |
| Hub | `/hubs/kitchen` | SignalR cozinha — `OrderCreated` / `OrderUpdated` |
| GET | `/api/orders/public/{uuid}` | Acompanhar pedido (cliente) |
| POST | `/api/tables/{id}/sessions/raise-cap` | Liberar teto da mesa |
| GET | `/api/audit` | Audit log (Admin) |
| GET | `/api/reports/daily?date=AAAA-MM-DD` | Relatório do dia (Admin) |

## Fotos dos produtos

Upload no admin → convertidas para **JPEG** (máx. 800px) e salvas em `bytea` no PostgreSQL.  
Servidas em `GET /api/menuitems/{id}/photo`.

## Banco compartilhado no Git

Depois de popular cardápio/fotos:

```powershell
npm run db:export
git add backend/db/snapshot.sql
git commit -m "Atualiza snapshot do banco"
```

Colegas restauram com `npm run setup` (ou `npm run db:restore`).  
Detalhes: [`backend/db/README.md`](backend/db/README.md)

### Modo kiosk (client)

Mesmo app do cliente. No tablet:

```
http://localhost:5173/mesa/{token}?kiosk=1
```

- Alvos de toque maiores  
- Badge “Kiosk”  
- Volta ao cardápio após ~90s de inatividade (exceto tela do pedido)  
- `?kiosk=0` desliga  

Checklist manual do cardápio: [`docs/MANUAL_TEST_MENU.md`](docs/MANUAL_TEST_MENU.md)

QR Codes: admin → **QR Codes**. No celular da mesma rede Wi‑Fi, ajuste `Restaurant:ClientPublicUrl` em `backend/appsettings.json` para o IP da máquina (ex.: `http://192.168.0.10:5173`) e reinicie a API — os QRs passam a apontar para esse endereço.

CI (GitHub Actions): em cada PR — build/test do backend + lint/build do client e admin. Local: `npm run ci`.

Decisões técnicas: [`docs/DECISIONS.md`](docs/DECISIONS.md)

Seed automático: usuários Admin e Cozinha (cardápio/mesas vêm do snapshot ou do cadastro).

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | `admin@goserv.local` | `admin123` |
| Cozinha | `cozinha@goserv.local` | `cozinha123` |

Credenciais do banco (dev): `localhost:5433` / `goserv` / `postgres` / `postgres`

---

## Documentação

- Arquitetura: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)  
- Decisões: [`docs/DECISIONS.md`](docs/DECISIONS.md)  
- Cronograma MVP: [`docs/ROADMAP.md`](docs/ROADMAP.md)  
- Scripts: [`scripts/README.md`](scripts/README.md)
