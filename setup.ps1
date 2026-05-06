param(
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipService
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found. Install it first, then run setup.ps1 again."
    }
}

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-Jdk25 {
    $javacVersion = (& javac -version 2>&1) -join " "

    if ($javacVersion -notmatch "25\.") {
        throw "This backend requires JDK 25. Current javac version: $javacVersion"
    }

    if ($env:JAVA_HOME) {
        $javaHomeJavac = Join-Path $env:JAVA_HOME "bin\javac.exe"

        if (Test-Path $javaHomeJavac) {
            $javaHomeVersion = (& $javaHomeJavac -version 2>&1) -join " "

            if ($javaHomeVersion -notmatch "25\.") {
                throw "JAVA_HOME must point to JDK 25. Current JAVA_HOME is '$env:JAVA_HOME' and reports '$javaHomeVersion'."
            }
        }
    }
}

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Step "Checking required tools"
if (-not $SkipBackend) {
    Require-Command java
    Require-Command javac
    Test-Jdk25
}

if (-not $SkipFrontend) {
    Require-Command node
    Require-Command npm
}

if (-not $SkipService) {
    Require-Command python
}

if (-not $SkipBackend) {
    Write-Step "Downloading backend Maven dependencies"
    Push-Location "$ProjectRoot\backend"
    try {
        .\mvnw.cmd dependency:go-offline
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipFrontend) {
    Write-Step "Installing frontend dependencies into frontend/node_modules"
    Push-Location "$ProjectRoot\frontend"
    try {
        npm install
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipService) {
    Write-Step "Creating FastAPI virtual environment and installing service dependencies"
    Push-Location "$ProjectRoot\service"
    try {
        if (-not (Test-Path ".\venv\Scripts\python.exe")) {
            python -m venv venv
        }

        .\venv\Scripts\python.exe -m pip install --upgrade pip
        .\venv\Scripts\python.exe -m pip install -r requirements.txt
    }
    finally {
        Pop-Location
    }
}

Write-Step "Setup complete"
Write-Host "Run backend:  cd backend; .\mvnw.cmd spring-boot:run"
Write-Host "Run frontend: cd frontend; npm run dev"
Write-Host "Run service:  cd service; .\venv\Scripts\Activate.ps1; uvicorn service:app --reload --port 8000"
