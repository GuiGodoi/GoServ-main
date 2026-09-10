# Snapshot do banco (versionado)

O arquivo `snapshot.sql` (gerado por `npm run db:export` ou `npm run db:reset`) contém
**schema + dados**, incluindo fotos e promoções.

## Fluxo do time

1. Após mudanças relevantes no banco (seed, migrações, cadastros, fotos):

```powershell
npm run db:export
git add backend/db/snapshot.sql
git commit -m "Atualiza snapshot do banco"
```

2. Para **zerar** e versionar uma base limpa (só usuários admin/cozinha):

```powershell
npm run db:reset
git add backend/db/snapshot.sql
git commit -m "Reseta snapshot do banco"
```

3. Outro integrante:

```powershell
npm run setup    # sobe Docker e restaura o snapshot
npm run dev
```

Sem snapshot, a API aplica migrations + seed mínimo (usuários).
