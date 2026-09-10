#Requires -Version 5.1
<#
.SYNOPSIS
  Zera o volume do PostgreSQL, sobe de novo, aplica migrations/seed e exporta snapshot.
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Get-Process -Name Backend -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Write-Host "==> Parando containers e apagando volume do banco..." -ForegroundColor Cyan
docker compose down -v
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Subindo PostgreSQL limpo..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-up.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Aplicando migrations + seed (API efemera)..." -ForegroundColor Cyan
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://127.0.0.1:5000"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "dotnet"
$psi.Arguments = "run --project `"$(Join-Path $Root 'backend\Backend.csproj')`" --no-launch-profile"
$psi.WorkingDirectory = $Root
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$proc = [System.Diagnostics.Process]::Start($psi)

$ok = $false
for ($i = 0; $i -lt 90; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch {}
  if ($proc.HasExited) { break }
}

if (-not $ok) {
  Write-Host "API nao respondeu a tempo." -ForegroundColor Red
  if (-not $proc.HasExited) { $proc.Kill() }
  exit 1
}

Write-Host "==> Exportando snapshot limpo..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "db-export.ps1")
$exportCode = $LASTEXITCODE

if (-not $proc.HasExited) { $proc.Kill() }
Get-Process -Name Backend -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if ($exportCode -ne 0) { exit $exportCode }

Write-Host ""
Write-Host "Banco limpo + snapshot atualizado em backend/db/snapshot.sql" -ForegroundColor Green
Write-Host "Commit o arquivo para o time compartilhar a base (apenas usuarios seed)."
