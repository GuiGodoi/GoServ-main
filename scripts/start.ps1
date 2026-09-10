#Requires -Version 5.1
<#
.SYNOPSIS
  Sobe banco + API + client + admin e abre o Chrome.
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Assert-Command($Name, $Hint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: '$Name' nao encontrado. $Hint" -ForegroundColor Red
    exit 1
  }
}

function Wait-Port([int]$Port, [int]$TimeoutSec = 60) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listening) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Test-PortOpen([int]$Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

Assert-Command "docker" "Instale e abra o Docker Desktop."
Assert-Command "dotnet" "Instale o .NET 8 SDK."
Assert-Command "npm" "Instale o Node.js LTS."

$clientModules = Join-Path $Root "client\node_modules"
$adminModules = Join-Path $Root "admin\node_modules"
if (-not (Test-Path $clientModules) -or -not (Test-Path $adminModules)) {
  Write-Host "Dependencias nao instaladas. Rodando setup..." -ForegroundColor Yellow
  & (Join-Path $PSScriptRoot "setup.ps1")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "==> Subindo PostgreSQL..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-up.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$backendDir = Join-Path $Root "backend"
$clientDir = Join-Path $Root "client"
$adminDir = Join-Path $Root "admin"

if (-not (Test-PortOpen 5000)) {
  Write-Host "==> Iniciando Backend (http://localhost:5000)..." -ForegroundColor Cyan
  Start-Process powershell -WorkingDirectory $backendDir -WindowStyle Minimized -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host 'Backend GoServ - http://localhost:5000' -ForegroundColor Green; dotnet run --launch-profile http"
  )
} else {
  Write-Host "Backend ja esta em http://localhost:5000" -ForegroundColor DarkGray
}

if (-not (Test-PortOpen 5173)) {
  Write-Host "==> Iniciando Client (http://localhost:5173)..." -ForegroundColor Cyan
  Start-Process powershell -WorkingDirectory $clientDir -WindowStyle Minimized -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host 'Client GoServ - http://localhost:5173' -ForegroundColor Green; npm run dev"
  )
} else {
  Write-Host "Client ja esta em http://localhost:5173" -ForegroundColor DarkGray
}

if (-not (Test-PortOpen 5174)) {
  Write-Host "==> Iniciando Admin (http://localhost:5174)..." -ForegroundColor Cyan
  Start-Process powershell -WorkingDirectory $adminDir -WindowStyle Minimized -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host 'Admin GoServ - http://localhost:5174' -ForegroundColor Green; npm run dev"
  )
} else {
  Write-Host "Admin ja esta em http://localhost:5174" -ForegroundColor DarkGray
}

Write-Host "==> Aguardando servicos..." -ForegroundColor Cyan
$okBackend = Wait-Port 5000 90
$okClient = Wait-Port 5173 90
$okAdmin = Wait-Port 5174 90

if (-not $okBackend) { Write-Host "AVISO: Backend nao respondeu a tempo na porta 5000." -ForegroundColor Yellow }
if (-not $okClient) { Write-Host "AVISO: Client nao respondeu a tempo na porta 5173." -ForegroundColor Yellow }
if (-not $okAdmin) { Write-Host "AVISO: Admin nao respondeu a tempo na porta 5174." -ForegroundColor Yellow }

$urls = @()
if ($okClient) { $urls += "http://localhost:5173" }
if ($okAdmin) { $urls += "http://localhost:5174" }

if ($urls.Count -gt 0) {
  Write-Host "==> Abrindo Chrome..." -ForegroundColor Cyan
  $chromeCandidates = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )
  $chrome = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($chrome) {
    Start-Process $chrome -ArgumentList ($urls -join " ")
  } else {
    foreach ($u in $urls) { Start-Process $u }
  }
}

Write-Host ""
Write-Host "GoServ no ar:" -ForegroundColor Green
Write-Host "  Banco:   localhost:5433"
Write-Host "  Backend: http://localhost:5000$(if (-not $okBackend) { ' (falhou)' })"
Write-Host "  Client:  http://localhost:5173$(if (-not $okClient) { ' (falhou)' })"
Write-Host "  Admin:   http://localhost:5174$(if (-not $okAdmin) { ' (falhou)' })"
Write-Host ""
Write-Host "Feche as janelas minimizadas do PowerShell para parar API/frontends."
Write-Host "Para parar o banco: npm run stop"
