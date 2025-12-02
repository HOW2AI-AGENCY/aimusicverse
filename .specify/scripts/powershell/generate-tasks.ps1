#!/usr/bin/env pwsh
param([string]$SpecsDir)
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
if (-not $SpecsDir) { $SpecsDir = $paths.FEATURE_DIR }
$tasks = Join-Path $SpecsDir 'tasks.md'
if (Test-Path $tasks) { Write-Output "tasks.md already exists: $tasks"; exit 0 }
# Very small generator: create tasks placeholder based on spec user stories
$spec = Join-Path $SpecsDir 'spec.md'
$front = @"---`nfeature: "Auto-generated"`nphase: "Phase 2 - Implementation"`ndate: "$(Get-Date -Format 'yyyy-MM-dd')"`ntotal_tasks: 1`np1_tasks: 1`n---`n"@
$body = "# Task List`n`n## P1 Tasks`n`n### Task T-001: Implement core (Priority: P1)`n`n**Description**: Placeholder task - implement core feature.`n`n**Acceptance Criteria**:`n- [ ] Implemented`n"
Set-Content -Path $tasks -Value ($front + "`n" + $body) -Force
Write-Output "Created placeholder tasks.md at $tasks"