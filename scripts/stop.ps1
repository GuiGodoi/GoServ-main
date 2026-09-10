#Requires -Version 5.1
<#
.SYNOPSIS
  Para o PostgreSQL (e outros serviços Docker do projeto).
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Parando containers Docker do GoServ..." -ForegroundColor Cyan
docker compose down
Write-Host "Banco parado. Feche as janelas do backend/frontend se ainda estiverem abertas." -ForegroundColor Green
