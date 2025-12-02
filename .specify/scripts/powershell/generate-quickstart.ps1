#!/usr/bin/env pwsh
param([string]$SpecsDir)
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
if (-not $SpecsDir) { $SpecsDir = $paths.FEATURE_DIR }
$quick = Join-Path $SpecsDir 'quickstart.md'
if (Test-Path $quick) { Write-Output "quickstart.md already exists: $quick"; exit 0 }
$content = "# Quickstart\n\nThis quickstart was auto-generated as a placeholder. Fill implementation steps.`n"
Set-Content -Path $quick -Value $content -Force
Write-Output "Created quickstart.md at $quick"