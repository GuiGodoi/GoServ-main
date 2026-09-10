#Requires -Version 5.1
<#
.SYNOPSIS
  Instala dependências do monorepo GoServ (primeira vez).
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Assert-Command($Name, $Hint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "ERRO: '$Name' nao encontrado." -ForegroundColor Red
    Write-Host $Hint
    exit 1
  }
}

Write-Host "==> Verificando ferramentas..." -ForegroundColor Cyan
Assert-Command "node" "Instale Node.js LTS: https://nodejs.org/"
Assert-Command "npm"  "Instale Node.js LTS: https://nodejs.org/"
Assert-Command "dotnet" "Instale .NET 8 SDK: https://dotnet.microsoft.com/download/dotnet/8.0"
Assert-Command "docker" "Instale Docker Desktop: https://www.docker.com/products/docker-desktop/"

$sdks = & dotnet --list-sdks 2>$null
if (-not ($sdks | Select-String -Pattern "^8\.")) {
  Write-Host ""
  Write-Host "ERRO: .NET 8 SDK nao encontrado (so runtime nao basta)." -ForegroundColor Red
  Write-Host "Instale: https://dotnet.microsoft.com/download/dotnet/8.0"
  Write-Host "Ou: winget install Microsoft.DotNet.SDK.8"
  exit 1
}

try {
  docker info 1>$null 2>$null
  if ($LASTEXITCODE -ne 0) { throw "Docker nao esta rodando" }
} catch {
  Write-Host ""
  Write-Host "ERRO: Docker Desktop precisa estar aberto e rodando." -ForegroundColor Red
  exit 1
}

Write-Host "==> Instalando dependencias do client..." -ForegroundColor Cyan
Push-Location (Join-Path $Root "client")
npm install
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "==> Instalando dependencias do admin..." -ForegroundColor Cyan
Push-Location (Join-Path $Root "admin")
npm install
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "==> Restaurando pacotes do backend (.NET)..." -ForegroundColor Cyan
dotnet restore (Join-Path $Root "backend\Backend.csproj")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Banco de dados..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-restore.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Setup concluido. Agora rode: npm run dev" -ForegroundColor Green
Write-Host "  Client (cardapio): http://localhost:5173"
Write-Host "  Admin (gestao):    http://localhost:5174"
Write-Host "  API:               http://localhost:5000"
Write-Host ""
Após popular dados/fotos/promoções: `npm run db:export` e commit de `backend/db/snapshot.sql`.  
Para zerar tudo (só usuários): `npm run db:reset`.
