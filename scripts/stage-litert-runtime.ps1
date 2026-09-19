[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$Source
)

$expectedFileName = 'litert-lm.dll'
$expectedSha256 = '0D6C933000245E86F53F591E38104B434DC77B516C7B6912C82F1B00C73BF191'
$sourcePath = (Resolve-Path -LiteralPath $Source).Path

if ((Split-Path -Leaf $sourcePath) -ne $expectedFileName) {
    throw "Expected $expectedFileName, got $(Split-Path -Leaf $sourcePath)."
}

$sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
if ($sourceHash -ne $expectedSha256) {
    throw 'The supplied LiteRT-LM runtime does not match Civra''s pinned 0.17.1 checksum.'
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $repositoryRoot 'app\src-tauri\runtime'
$targetPath = Join-Path $runtimeDirectory $expectedFileName
New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force

$targetHash = (Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash
if ($targetHash -ne $expectedSha256) {
    throw 'The staged LiteRT-LM runtime failed its post-copy checksum verification.'
}

Write-Output "Staged verified LiteRT-LM runtime at $targetPath"
