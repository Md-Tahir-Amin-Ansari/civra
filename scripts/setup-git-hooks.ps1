$ErrorActionPreference = 'Stop'
git config core.hooksPath .githooks
Write-Host 'Configured Git to use the repository hooks in .githooks.' -ForegroundColor Green
