#Requires -Version 5.1
<#
.SYNOPSIS
  Zera o volume do PostgreSQL, sobe de novo, aplica migrations/seed e exporta snapshot.

  Use isto quando quiser "zerar tudo" e voltar para o banco no estado inicial
  (só com os usuários/dados de seed, sem nada que você tenha criado depois).
#>

# Se algo falhar, o script para na hora.
$ErrorActionPreference = "Stop"

# Roda a partir da raiz do projeto, independente de onde o script foi chamado.
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# --- Passo 1: garantir que nenhum backend antigo está rodando e travando a porta 5000 ---
Get-Process -Name Backend -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# --- Passo 2: apagar o container e o volume do banco (isso apaga os dados de verdade) ---
Write-Host "==> Parando containers e apagando volume do banco..." -ForegroundColor Cyan
docker compose down -v
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- Passo 3: subir um banco novo, vazio ---
Write-Host "==> Subindo PostgreSQL limpo..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-up.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- Passo 4: rodar o backend só para ele criar as tabelas e os dados de seed ---
# A API, ao iniciar, aplica automaticamente as migrations e popula os dados iniciais.
# Isso é feito em background (sem janela), só para preparar o banco; depois é encerrado.
Write-Host "==> Aplicando migrations + seed (API efemera)..." -ForegroundColor Cyan
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://127.0.0.1:5000"

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "dotnet"
$psi.Arguments = "run --project `"$(Join-Path $Root 'backend\Backend.csproj')`" --no-launch-profile"
$psi.WorkingDirectory = $Root
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$backendProcess = [System.Diagnostics.Process]::Start($psi)

# Espera a API responder em /api/health (checando a cada 2s, por até 3 minutos).
$apiReady = $false
for ($i = 0; $i -lt 90; $i++) {
  Start-Sleep -Seconds 2
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) { $apiReady = $true; break }
  } catch {
    # Ainda subindo: ignora o erro e tenta de novo na próxima volta do loop.
  }
  if ($backendProcess.HasExited) { break }
}

if (-not $apiReady) {
  Write-Host "API nao respondeu a tempo." -ForegroundColor Red
  if (-not $backendProcess.HasExited) { $backendProcess.Kill() }
  exit 1
}

# --- Passo 5: banco já populado com os dados de seed -> exportar o snapshot limpo ---
Write-Host "==> Exportando snapshot limpo..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-export.ps1")
$exportExitCode = $LASTEXITCODE

# --- Passo 6: a API temporária já cumpriu seu papel, pode ser encerrada ---
if (-not $backendProcess.HasExited) { $backendProcess.Kill() }
Get-Process -Name Backend -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if ($exportExitCode -ne 0) { exit $exportExitCode }

Write-Host ""
Write-Host "Banco limpo + snapshot atualizado em backend/db/snapshot.sql" -ForegroundColor Green
Write-Host "Commit o arquivo para o time compartilhar a base (apenas usuarios seed)."
