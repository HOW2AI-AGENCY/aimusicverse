#!/usr/bin/env pwsh
param(
    [string]$SpecPath,
    [string]$OutputDir
)
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
if (-not $SpecPath) { $SpecPath = $paths.FEATURE_SPEC }
if (-not $OutputDir) { $OutputDir = $paths.CONTRACTS_DIR }
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }
$api = Join-Path $OutputDir 'api.yaml'
if (Test-Path $api) { Write-Output "contracts already exist: $api"; exit 0 }
$yaml = "openapi: '3.0.0'`ninfo:`n  title: 'Auto-generated API'`n  version: '1.0.0'`npaths: {} `n"
Set-Content -Path $api -Value $yaml -Force
Write-Output "Created placeholder OpenAPI at $api"