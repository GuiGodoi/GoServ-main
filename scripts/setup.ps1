#Requires -Version 5.1
<#
.SYNOPSIS
  Instala dependências do monorepo GoServ (primeira vez).

  O que este script faz, em ordem:
    1. Confere se as ferramentas necessárias estão instaladas (Node, npm, dotnet, Docker).
    2. Instala os pacotes do client (site do cardápio) e do admin (painel de gestão).
    3. Restaura os pacotes NuGet do backend (.NET).
    4. Sobe o banco de dados e restaura o snapshot salvo no repositório.
#>

# Se qualquer comando falhar, o script para na hora (em vez de continuar com erro).
$ErrorActionPreference = "Stop"

# Garante que os comandos abaixo rodem sempre a partir da raiz do projeto,
# não importa de onde o script foi chamado.
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# Verifica se um programa (ex: "node") existe no computador.
# Se não existir, mostra uma dica de como instalar e encerra o script.
function Assert-Command($Name, $Hint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "ERRO: '$Name' nao encontrado." -ForegroundColor Red
    Write-Host $Hint
    exit 1
  }
}

# --- Passo 1: checar se as ferramentas necessárias estão instaladas ---
Write-Host "==> Verificando ferramentas..." -ForegroundColor Cyan
Assert-Command "node" "Instale Node.js LTS: https://nodejs.org/"
Assert-Command "npm"  "Instale Node.js LTS: https://nodejs.org/"
Assert-Command "dotnet" "Instale .NET 8 SDK: https://dotnet.microsoft.com/download/dotnet/8.0"
Assert-Command "docker" "Instale Docker Desktop: https://www.docker.com/products/docker-desktop/"

# O comando "dotnet" pode existir mas só com o runtime (sem o SDK 8).
# Aqui confirmamos que o SDK 8 especificamente está instalado.
$sdks = & dotnet --list-sdks 2>$null
if (-not ($sdks | Select-String -Pattern "^8\.")) {
  Write-Host ""
  Write-Host "ERRO: .NET 8 SDK nao encontrado (so runtime nao basta)." -ForegroundColor Red
  Write-Host "Instale: https://dotnet.microsoft.com/download/dotnet/8.0"
  Write-Host "Ou: winget install Microsoft.DotNet.SDK.8"
  exit 1
}

# O Docker Desktop precisa estar aberto (não basta estar instalado).
try {
  docker info 1>$null 2>$null
  if ($LASTEXITCODE -ne 0) { throw "Docker nao esta rodando" }
} catch {
  Write-Host ""
  Write-Host "ERRO: Docker Desktop precisa estar aberto e rodando." -ForegroundColor Red
  exit 1
}

# --- Passo 2: instalar dependências do front-end (client + admin) ---
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

# --- Passo 3: restaurar pacotes do backend (.NET) ---
Write-Host "==> Restaurando pacotes do backend (.NET)..." -ForegroundColor Cyan
dotnet restore (Join-Path $Root "backend\Backend.csproj")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- Passo 4: subir o banco e restaurar os dados salvos no repositório ---
Write-Host "==> Banco de dados..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-restore.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Setup concluido. Agora rode: npm run dev" -ForegroundColor Green
Write-Host "  Client (cardapio): http://localhost:5173"
Write-Host "  Admin (gestao):    http://localhost:5174"
Write-Host "  API:               http://localhost:5000"
Write-Host ""
