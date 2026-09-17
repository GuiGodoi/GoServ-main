#Requires -Version 5.1
<#
.SYNOPSIS
  Exporta o banco completo (schema + dados, incl. fotos) para backend/db/snapshot.sql
#>

# Se algo falhar, o script para na hora.
$ErrorActionPreference = "Stop"

# Roda a partir da raiz do projeto, independente de onde o script foi chamado.
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# Arquivo onde o "retrato" (snapshot) do banco vai ser salvo.
$OutFile = Join-Path $Root "backend\db\snapshot.sql"
New-Item -ItemType Directory -Force -Path (Split-Path $OutFile) | Out-Null

Write-Host "==> Exportando PostgreSQL (schema + dados)..." -ForegroundColor Cyan

# pg_dump gera um arquivo .sql com toda a estrutura e os dados do banco.
#   --clean --if-exists : o snapshot já vem com comandos para apagar tabelas antigas antes de recriar
#   --no-owner --no-privileges : não trava o arquivo ao usuário "postgres" (funciona em qualquer máquina)
#   --inserts : salva os dados como comandos INSERT (mais fácil de ler/versionar no Git)
docker compose exec -T db pg_dump `
  -U postgres `
  -d goserv `
  --clean `
  --if-exists `
  --no-owner `
  --no-privileges `
  --inserts |
  Set-Content -Path $OutFile -Encoding utf8

# Se o arquivo ficou muito pequeno, algo deu errado na exportação (banco vazio ou não iniciado).
if (-not (Test-Path $OutFile) -or (Get-Item $OutFile).Length -lt 100) {
  Write-Host "ERRO: dump vazio. Suba o banco (npm run db:up) e a API ao menos uma vez." -ForegroundColor Red
  exit 1
}

$sizeKb = [math]::Round((Get-Item $OutFile).Length / 1KB, 1)
Write-Host "Snapshot salvo: backend/db/snapshot.sql ($sizeKb KB)" -ForegroundColor Green
Write-Host "Commit este arquivo para o time compartilhar o mesmo banco (com fotos)."
