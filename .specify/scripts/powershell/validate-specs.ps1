#!/usr/bin/env pwsh
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
# Basic validation: ensure plan.md and tasks.md exist
$errors = @()
if (-not (Test-Path $paths.FEATURE_SPEC)) { $errors += "Missing spec.md at $($paths.FEATURE_SPEC)" }
if (-not (Test-Path $paths.IMPL_PLAN)) { $errors += "Missing plan.md at $($paths.IMPL_PLAN)" }
if (-not (Test-Path $paths.TASKS)) { $errors += "Missing tasks.md at $($paths.TASKS)" }
if ($errors.Count -gt 0) { Write-Output "Validation failed:"; $errors | ForEach-Object { Write-Output " - $_"}; exit 1 }
Write-Output "Basic spec validation passed"
# JSON Schema validation placeholders
$contracts = $paths.CONTRACTS_DIR
if (Test-Path $contracts) { Write-Output "Contracts dir found: $contracts" }
Write-Output "validate-specs complete"