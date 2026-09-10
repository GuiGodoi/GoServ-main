# Banco de dados (PostgreSQL)

Em desenvolvimento o banco sobe com Docker:

```powershell
# na raiz do monorepo
npm run db:up
```

Connection string (já configurada em `appsettings.json`):

```
Host=localhost;Port=5433;Database=goserv;Username=postgres;Password=postgres
```

O schema é criado pelas **migrations do EF Core** quando a API inicia.

O arquivo `db/init.sql` é apenas referência/manual; não é usado pelo fluxo padrão (`npm run dev`).
