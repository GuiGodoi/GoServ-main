#Requires -Version 5.1
<#
.SYNOPSIS
  Sobe banco + API + client + admin e abre o Chrome.

  O que este script faz, em ordem:
    1. Confere se as ferramentas necessárias estão instaladas.
    2. Instala dependências automaticamente se ainda não tiverem sido instaladas.
    3. Sobe o banco de dados (Docker).
    4. Abre backend, client e admin cada um em uma janela minimizada do PowerShell
       (pula quem já estiver rodando, para não abrir janelas duplicadas).
    5. Espera cada serviço responder na sua porta e abre o navegador.
#>

# Se algo falhar, o script para na hora.
$ErrorActionPreference = "Stop"

# Roda a partir da raiz do projeto, independente de onde o script foi chamado.
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# Verifica se um programa (ex: "docker") existe no computador.
function Assert-Command($Name, $Hint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: '$Name' nao encontrado. $Hint" -ForegroundColor Red
    exit 1
  }
}

# Diz se algum programa já está "escutando" (ouvindo conexões) numa porta local.
function Test-PortOpen([int]$Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

# Espera até uma porta ficar aberta, checando de meio em meio segundo,
# até o tempo limite (em segundos) ser atingido. Retorna $true/$false.
function Wait-Port([int]$Port, [int]$TimeoutSec = 60) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortOpen $Port) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

# Abre um serviço numa janela de PowerShell minimizada, só se ele ainda não
# estiver rodando na porta indicada. Evita abrir janelas duplicadas ao rodar
# "npm run dev" mais de uma vez.
function Start-DevService([string]$Name, [string]$WorkingDirectory, [int]$Port, [string]$Command) {
  if (Test-PortOpen $Port) {
    Write-Host "$Name ja esta em http://localhost:$Port" -ForegroundColor DarkGray
    return
  }

  Write-Host "==> Iniciando $Name (http://localhost:$Port)..." -ForegroundColor Cyan
  Start-Process powershell -WorkingDirectory $WorkingDirectory -WindowStyle Minimized -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host '$Name GoServ - http://localhost:$Port' -ForegroundColor Green; $Command"
  )
}

# --- Passo 1: checar se as ferramentas necessárias estão instaladas ---
Assert-Command "docker" "Instale e abra o Docker Desktop."
Assert-Command "dotnet" "Instale o .NET 8 SDK."
Assert-Command "npm" "Instale o Node.js LTS."

# --- Passo 2: instalar dependências automaticamente na primeira vez ---
$clientModules = Join-Path $Root "client\node_modules"
$adminModules = Join-Path $Root "admin\node_modules"
if (-not (Test-Path $clientModules) -or -not (Test-Path $adminModules)) {
  Write-Host "Dependencias nao instaladas. Rodando setup..." -ForegroundColor Yellow
  & (Join-Path $PSScriptRoot "setup.ps1")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# --- Passo 3: subir o banco de dados ---
Write-Host "==> Subindo PostgreSQL..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-up.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$backendDir = Join-Path $Root "backend"
$clientDir = Join-Path $Root "client"
$adminDir = Join-Path $Root "admin"

# --- Passo 4: abrir backend, client e admin (cada um numa janela própria) ---
Start-DevService -Name "Backend" -WorkingDirectory $backendDir -Port 5000 -Command "dotnet run --launch-profile http"
Start-DevService -Name "Client"  -WorkingDirectory $clientDir  -Port 5173 -Command "npm run dev"
Start-DevService -Name "Admin"   -WorkingDirectory $adminDir   -Port 5174 -Command "npm run dev"

# --- Passo 5: esperar cada serviço responder na sua porta ---
Write-Host "==> Aguardando servicos..." -ForegroundColor Cyan
$backendReady = Wait-Port 5000 90
$clientReady = Wait-Port 5173 90
$adminReady = Wait-Port 5174 90

if (-not $backendReady) { Write-Host "AVISO: Backend nao respondeu a tempo na porta 5000." -ForegroundColor Yellow }
if (-not $clientReady) { Write-Host "AVISO: Client nao respondeu a tempo na porta 5173." -ForegroundColor Yellow }
if (-not $adminReady) { Write-Host "AVISO: Admin nao respondeu a tempo na porta 5174." -ForegroundColor Yellow }

# --- Passo 6: abrir o Chrome nas páginas que ficaram prontas ---
$urls = @()
if ($clientReady) { $urls += "http://localhost:5173" }
if ($adminReady) { $urls += "http://localhost:5174" }

if ($urls.Count -gt 0) {
  Write-Host "==> Abrindo Chrome..." -ForegroundColor Cyan

  # Procura o Chrome nos locais mais comuns de instalação.
  $chromeCandidates = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )
  $chrome = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

  if ($chrome) {
    Start-Process $chrome -ArgumentList ($urls -join " ")
  } else {
    # Chrome não encontrado: abre cada URL no navegador padrão do Windows.
    foreach ($url in $urls) { Start-Process $url }
  }
}

# --- Resumo final ---
Write-Host ""
Write-Host "GoServ no ar:" -ForegroundColor Green
Write-Host "  Banco:   localhost:5433"
Write-Host "  Backend: http://localhost:5000$(if (-not $backendReady) { ' (falhou)' })"
Write-Host "  Client:  http://localhost:5173$(if (-not $clientReady) { ' (falhou)' })"
Write-Host "  Admin:   http://localhost:5174$(if (-not $adminReady) { ' (falhou)' })"
Write-Host ""
Write-Host "Feche as janelas minimizadas do PowerShell para parar API/frontends."
Write-Host "Para parar o banco: npm run stop"
