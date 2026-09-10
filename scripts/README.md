# GoServ — scripts de desenvolvimento

## Uso (na raiz do projeto)

```powershell
npm run setup   # primeira vez: client + admin + dotnet restore
npm run dev     # sobe banco + backend + client + admin
npm run stop    # para o banco (Docker)
```

## Arquivos

| Comando | O que faz |
|---------|-----------|
| `setup.ps1` | Instala dependências + sobe DB + restaura snapshot |
| `db-up.ps1` | Sobe PostgreSQL e espera ficar healthy |
| `db-export.ps1` | Gera `backend/db/snapshot.sql` (versionar) |
| `db-restore.ps1` | Restaura o snapshot no Docker |
| `db-reset.ps1` | Apaga volume, seed mínimo e reexporta snapshot |
| `start.ps1` | Dispara a task do editor (ou fallback em janelas externas) |
| `stop.ps1` | `docker compose down` |

## Terminal integrado (Cursor / VS Code)

A task **GoServ: Dev** em `.vscode/tasks.json` abre:

- **DB** (`npm run db:up`)
- **Backend** (`dotnet run`) — :5000
- **Client** (`npm run dev`) — :5173
- **Admin** (`npm run dev`) — :5174

Preferência: `npm run dev` de dentro do editor, ou **Ctrl+Shift+B**.
