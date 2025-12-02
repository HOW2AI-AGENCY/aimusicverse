#!/usr/bin/env pwsh
param([string]$SpecPath)
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
if (-not $SpecPath) { $SpecPath = $paths.FEATURE_SPEC }
$dataModel = $paths.DATA_MODEL
if (Test-Path $dataModel) { Write-Output "data-model.md already exists: $dataModel"; exit 0 }
$content = "# Data Model`n`nThis is an auto-generated placeholder. Please review and edit.`n`n## Entities`n`n- TODO: extract entities from spec.md`
"
Set-Content -Path $dataModel -Value $content -Force
Write-Output "Created placeholder data-model.md at $dataModel"