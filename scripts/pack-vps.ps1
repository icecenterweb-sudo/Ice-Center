param(
  [string]$OutName = "ice-center-vps.zip"
)

$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
$staging = Join-Path $env:TEMP "ice-center-vps-staging"
$zipPath = Join-Path $project $OutName

Write-Host "==> Packaging project for VPS..." -ForegroundColor Cyan

if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

$excludeDirs = @("node_modules", ".next", ".git", ".vscode", ".idea", "backups", "temp", "logs", ".turbo", ".cache", ".claude", ".codex", ".opencode", ".agents", ".cursor", ".github")
$excludeFiles = @(".env", ".env.local", ".env.development", $OutName, "*.zip", "*.log", ".gitignore", ".gitattributes")

# Build robocopy exclude args
$xdArgs = $excludeDirs | ForEach-Object { "/XD"; $_ }
$xfArgs = $excludeFiles | ForEach-Object { "/XF"; $_ }

Write-Host "==> Copying files to staging (excluding dev artifacts)..." -ForegroundColor Cyan
robocopy $project $staging /E /NFL /NDL /NP $xdArgs $xfArgs /XA:SH | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

# SECURITY (#34): do NOT bake secrets into the artifact.
# The zip must never contain .env / .env.production — transfer secrets out-of-band.
$envProd = Join-Path $staging ".env.production"
$envFinal = Join-Path $staging ".env"
if (Test-Path $envProd) { Remove-Item $envProd -Force }
if (Test-Path $envFinal) { Remove-Item $envFinal -Force }
Write-Host "==> Secrets excluded from package. Upload your .env to the VPS separately (e.g. scp)." -ForegroundColor Green

Write-Host "==> Compressing to $OutName ..." -ForegroundColor Cyan
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -CompressionLevel Optimal

Remove-Item -Recurse -Force $staging

$size = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "==> Done: $zipPath ($size MB)" -ForegroundColor Green
Write-Host "==> Transfer this zip to your VPS, upload your .env alongside it, then run:" -ForegroundColor Yellow
Write-Host "    npm install && npx prisma generate && npx prisma migrate deploy && npm run build" -ForegroundColor Yellow
