[CmdletBinding()]
param(
    [switch]$Staged,
    [string]$BaseRef
)

$ErrorActionPreference = 'Stop'

if ($Staged) {
    $changed = @(git diff --cached --name-only)
}
else {
    if ([string]::IsNullOrWhiteSpace($BaseRef)) {
        $BaseRef = $env:GITHUB_BASE_REF
    }
    if ([string]::IsNullOrWhiteSpace($BaseRef)) {
        $BaseRef = 'main'
    }

    git fetch origin $BaseRef --depth=1 | Out-Null
    $baseCommit = (git merge-base "origin/$BaseRef" HEAD).Trim()
    $changed = @(git diff --name-only "$baseCommit...HEAD")
}

$changed = @($changed | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
if ($changed.Count -eq 0) {
    exit 0
}

$substantive = @($changed | Where-Object { $_ -ne 'CONTEXT.md' })
if ($substantive.Count -gt 0 -and $changed -notcontains 'CONTEXT.md') {
    Write-Host 'A substantive change requires an updated CONTEXT.md.' -ForegroundColor Red
    Write-Host ('Changed files: ' + ($changed -join ', ')) -ForegroundColor Yellow
    exit 1
}

Write-Host 'CONTEXT.md update policy passed.' -ForegroundColor Green
