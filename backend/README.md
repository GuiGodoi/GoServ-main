# Backend GoServ

ASP.NET Core 8 Web API com camadas **Controller → Service → Repository**.

## Rodar

Com o PostgreSQL no ar (`npm run db:up` na raiz):

```powershell
dotnet run --launch-profile http
```

API em http://localhost:5000

## Endpoints

| Rota | Uso |
|------|-----|
| `GET /api/health` | Health check |
| `GET/POST/PUT/DELETE /api/categories` | Categorias |
| `GET/POST/PUT/DELETE /api/menuitems` | Produtos |
| `GET /api/menuitems?availableOnly=true` | Cardápio do cliente |

No startup: aplica migrations e o seed (`Data/DbSeeder.cs`) se o banco estiver vazio.

Detalhes do banco: [README-db.md](README-db.md)
