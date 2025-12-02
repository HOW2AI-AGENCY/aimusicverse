#!/usr/bin/env pwsh
param([switch]$DryRun)
. "$PSScriptRoot/common.ps1"
$repo = Get-RepoRoot
$specDirs = Get-ChildItem -Path (Join-Path $repo 'specs') -Directory -ErrorAction SilentlyContinue
foreach ($d in $specDirs) {
    $spec = Join-Path $d.FullName 'spec.md'
    $plan = Join-Path $d.FullName 'plan.md'
    $research = Join-Path $d.FullName 'research.md'
    $data = Join-Path $d.FullName 'data-model.md'
    $contracts = Join-Path $d.FullName 'contracts'
    $quick = Join-Path $d.FullName 'quickstart.md'
    $tasks = Join-Path $d.FullName 'tasks.md'
    Write-Output "Inspecting $d"
    if (-not (Test-Path $spec)) { Write-Output "  Missing spec.md -> creating placeholder"; if (-not $DryRun) { Set-Content -Path $spec -Value "# Spec placeholder" -Force } }
    if (-not (Test-Path $plan)) { Write-Output "  Missing plan.md -> creating placeholder"; if (-not $DryRun) { Set-Content -Path $plan -Value "# Plan placeholder" -Force } }
    if (-not (Test-Path $research)) { Write-Output "  Missing research.md -> creating placeholder"; if (-not $DryRun) { Set-Content -Path $research -Value "# Research placeholder" -Force } }
    if (-not (Test-Path $data)) { Write-Output "  Missing data-model.md -> creating placeholder"; if (-not $DryRun) { Set-Content -Path $data -Value "# Data model placeholder" -Force } }
    if (-not (Test-Path $contracts)) { Write-Output "  Missing contracts/ -> creating dir"; if (-not $DryRun) { New-Item -ItemType Directory -Path $contracts -Force | Out-Null } }
    if (-not (Test-Path $quick)) { Write-Output "  Missing quickstart.md -> creating placeholder"; if (-not $DryRun) { Set-Content -Path $quick -Value "# Quickstart placeholder" -Force } }
    if (-not (Test-Path $tasks)) { Write-Output "  Missing tasks.md -> creating placeholder"; if (-not $DryRun) { Set-Content -Path $tasks -Value "# Tasks placeholder" -Force } }
}
Write-Output "Migration pass complete"