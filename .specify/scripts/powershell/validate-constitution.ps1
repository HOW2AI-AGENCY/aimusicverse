#!/usr/bin/env pwsh
param([string]$PlanPath)
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
if (-not $PlanPath) { $PlanPath = $paths.IMPL_PLAN }
if (-not (Test-Path $PlanPath)) { Write-Output "Plan not found: $PlanPath"; exit 1 }
$plan = Get-Content $PlanPath -Raw
if ($plan -match 'NEEDS CLARIFICATION') {
    Write-Output "GATE_STATUS: WARNING`nPrinciples: Observability/Performance need clarification"
    exit 2
}
Write-Output "GATE_STATUS: APPROVED"
exit 0