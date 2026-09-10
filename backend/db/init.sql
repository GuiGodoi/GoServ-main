-- Referência manual (opcional).
-- No fluxo padrão (npm run dev), o schema é criado pelas migrations do EF Core
-- (tabelas Categories e MenuItems). Não monte este arquivo no Docker se for
-- usar migrations, para evitar esquemas conflitantes.

-- Exemplo de seed (só se as tabelas EF já existirem):
-- INSERT INTO "Categories" ("Name") VALUES ('Entradas');
-- INSERT INTO "Categories" ("Name") VALUES ('Pratos Principais');
