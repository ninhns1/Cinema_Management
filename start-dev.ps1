<#
One-click dev start script for Windows PowerShell
- Starts MongoDB container (if Docker is available)
- Starts backend (booking-order) in a new PowerShell window
- Starts frontend (web) in a new PowerShell window

Run from an elevated PowerShell if you need to bind ports or control Docker.
Usage:
  Open PowerShell and run:
    powershell -ExecutionPolicy Bypass -File "d:\cinema\Cinema_Management\start-dev.ps1"
#>

function Write-Line { param($s) Write-Host $s }

$repoRoot = 'd:\cinema\Cinema_Management'
$mongoContainerName = 'cinema-mongo'
$backendPath = Join-Path $repoRoot 'backend\services\booking-order'
$frontendPath = Join-Path $repoRoot 'frontend\web'

Write-Line "Starting development environment script"

# 1) Start MongoDB using Docker if available
$dockerAvailable = $false
try {
    $null = & docker --version 2>$null
    $dockerAvailable = $true
} catch {
    $dockerAvailable = $false
}

if ($dockerAvailable) {
    Write-Line "Docker detected — starting MongoDB container ($mongoContainerName)"
    try {
        & docker rm -f $mongoContainerName 2>$null | Out-Null
    } catch {}

    try {
        & docker run -d --name $mongoContainerName -p 27017:27017 mongo:6 | Out-Null
        Write-Line "MongoDB container started (mapped to localhost:27017)"
    } catch {
        Write-Line "Failed to start mongo container via docker: $_"
    }
} else {
    Write-Line "Docker not found. Ensure MongoDB is running locally at mongodb://localhost:27017 or install Docker. Skipping docker start."
}

Start-Sleep -Seconds 2

# 2) Ensure backend .env exists (copy from example if missing)
if (!(Test-Path (Join-Path $backendPath '.env'))) {
    if (Test-Path (Join-Path $backendPath '.env.example')) {
        Copy-Item (Join-Path $backendPath '.env.example') (Join-Path $backendPath '.env') -Force
        Write-Line "Copied .env.example to backend .env"
    } else {
        Write-Line "No .env or .env.example found in backend — please create one at $backendPath\.env"
    }
}

# 3) Start backend in new PowerShell window
$backendCmd = @"
Set-Location -Path '$backendPath'
if (!(Test-Path 'node_modules')) { Write-Host 'Installing backend dependencies...' ; npm install }
Write-Host 'Starting booking-order backend (npm start)'
npm start
"@

Write-Line "Opening backend in new PowerShell window..."
Start-Process -FilePath powershell -ArgumentList '-NoExit','-Command',$backendCmd

Start-Sleep -Milliseconds 700

# 4) Start frontend in new PowerShell window
$frontendCmd = @"
Set-Location -Path '$frontendPath'
if (!(Test-Path 'node_modules')) { Write-Host 'Installing frontend dependencies...' ; npm install }
Write-Host 'Starting frontend dev server (npm run dev)'
npm run dev
"@

Write-Line "Opening frontend in new PowerShell window..."
Start-Process -FilePath powershell -ArgumentList '-NoExit','-Command',$frontendCmd

Start-Sleep -Seconds 2

# 5) Quick health checks
Write-Line "Waiting a few seconds for services to start..."
Start-Sleep -Seconds 5

try {
    $health = Invoke-WebRequest -Uri 'http://localhost:4003/health' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Line "Backend health: $($health.StatusCode)"
} catch {
    Write-Line "Backend health check failed — backend may still be starting or not started. Check the backend PowerShell window for logs."
}

# 6) Open frontend URL in default browser
$frontendUrl = 'http://localhost:5173'
Write-Line "Opening frontend in browser: $frontendUrl"
Start-Process $frontendUrl

Write-Line "Done. Check the two new PowerShell windows for backend and frontend logs. If something fails, copy the logs and share them for further debugging."