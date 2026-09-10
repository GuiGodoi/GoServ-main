#Requires -Version 5.1
<#
.SYNOPSIS
  Sobe o PostgreSQL e espera ficar pronto (usado pelo tasks.json e pelo start.ps1).
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "ERRO: docker nao encontrado. Instale e abra o Docker Desktop." -ForegroundColor Red
  exit 1
}

try {
  docker info 1>$null 2>$null
  if ($LASTEXITCODE -ne 0) { throw "Docker offline" }
} catch {
  Write-Host "ERRO: Docker Desktop precisa estar aberto e rodando." -ForegroundColor Red
  exit 1
}

Write-Host "==> Subindo PostgreSQL (Docker)..." -ForegroundColor Cyan
docker compose up -d db
if ($LASTEXITCODE -ne 0) {
  Write-Host "Falha ao subir o banco." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "==> Aguardando banco ficar pronto..." -ForegroundColor Cyan
$ready = $false
for ($i = 1; $i -le 30; $i++) {
  docker compose exec -T db pg_isready -U postgres -d goserv 1>$null 2>$null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 1
}

if (-not $ready) {
  Write-Host "Timeout: PostgreSQL nao ficou pronto a tempo." -ForegroundColor Red
  exit 1
}

Write-Host "PostgreSQL pronto em localhost:5433" -ForegroundColor Green
