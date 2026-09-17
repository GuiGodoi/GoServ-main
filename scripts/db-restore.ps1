#Requires -Version 5.1
<#
.SYNOPSIS
  Restaura backend/db/snapshot.sql no PostgreSQL do Docker (se existir).
#>

# Se algo falhar, o script para na hora.
$ErrorActionPreference = "Stop"

# Roda a partir da raiz do projeto, independente de onde o script foi chamado.
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# --- Passo 1: garantir que o banco está de pé antes de restaurar ---
Write-Host "==> Subindo PostgreSQL..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-up.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- Passo 2: se não existe snapshot salvo, não há o que restaurar ---
# Nesse caso a própria API cria as tabelas e os dados iniciais na primeira execução.
$Snap = Join-Path $Root "backend\db\snapshot.sql"
if (-not (Test-Path $Snap)) {
  Write-Host "Sem snapshot (backend/db/snapshot.sql). A API aplica migrations + seed na primeira subida." -ForegroundColor Yellow
  exit 0
}

# --- Passo 3: aplicar o snapshot dentro do container do banco ---
Write-Host "==> Restaurando snapshot do repositorio..." -ForegroundColor Cyan
Get-Content $Snap -Raw -Encoding utf8 | docker compose exec -T db psql -U postgres -d goserv
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERRO ao restaurar snapshot." -ForegroundColor Red
  exit 1
}

Write-Host "Banco restaurado de backend/db/snapshot.sql" -ForegroundColor Green
