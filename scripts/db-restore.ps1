#Requires -Version 5.1
<#
.SYNOPSIS
  Restaura backend/db/snapshot.sql no PostgreSQL do Docker (se existir).
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Subindo PostgreSQL..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-up.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$Snap = Join-Path $Root "backend\db\snapshot.sql"
if (-not (Test-Path $Snap)) {
  Write-Host "Sem snapshot (backend/db/snapshot.sql). A API aplica migrations + seed na primeira subida." -ForegroundColor Yellow
  exit 0
}

Write-Host "==> Restaurando snapshot do repositorio..." -ForegroundColor Cyan
Get-Content $Snap -Raw -Encoding utf8 | docker compose exec -T db psql -U postgres -d goserv
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERRO ao restaurar snapshot." -ForegroundColor Red
  exit 1
}

Write-Host "Banco restaurado de backend/db/snapshot.sql" -ForegroundColor Green
