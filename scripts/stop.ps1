#Requires -Version 5.1
<#
.SYNOPSIS
  Para o PostgreSQL (e outros serviços Docker do projeto).
#>

# Se algo falhar, o script para na hora.
$ErrorActionPreference = "Stop"

# Roda a partir da raiz do projeto, independente de onde o script foi chamado.
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# "docker compose down" desliga e remove os containers definidos no docker-compose.yml
# (mas mantém o volume com os dados do banco, ou seja, nada é apagado).
Write-Host "==> Parando containers Docker do GoServ..." -ForegroundColor Cyan
docker compose down
Write-Host "Banco parado. Feche as janelas do backend/frontend se ainda estiverem abertas." -ForegroundColor Green
