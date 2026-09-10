#Requires -Version 5.1
<#
.SYNOPSIS
  Exporta o banco completo (schema + dados, incl. fotos) para backend/db/snapshot.sql
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$OutFile = Join-Path $Root "backend\db\snapshot.sql"
New-Item -ItemType Directory -Force -Path (Split-Path $OutFile) | Out-Null

Write-Host "==> Exportando PostgreSQL (schema + dados)..." -ForegroundColor Cyan

docker compose exec -T db pg_dump `
  -U postgres `
  -d goserv `
  --clean `
  --if-exists `
  --no-owner `
  --no-privileges `
  --inserts |
  Set-Content -Path $OutFile -Encoding utf8

if (-not (Test-Path $OutFile) -or (Get-Item $OutFile).Length -lt 100) {
  Write-Host "ERRO: dump vazio. Suba o banco (npm run db:up) e a API ao menos uma vez." -ForegroundColor Red
  exit 1
}

$sizeKb = [math]::Round((Get-Item $OutFile).Length / 1KB, 1)
Write-Host "Snapshot salvo: backend/db/snapshot.sql ($sizeKb KB)" -ForegroundColor Green
Write-Host "Commit este arquivo para o time compartilhar o mesmo banco (com fotos)."
