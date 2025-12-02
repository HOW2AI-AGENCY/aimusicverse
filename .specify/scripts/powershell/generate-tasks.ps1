#!/usr/bin/env pwsh
param([string]$SpecsDir)
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
if (-not $SpecsDir) { $SpecsDir = $paths.FEATURE_DIR }
$tasks = Join-Path $SpecsDir 'tasks.md'
if (Test-Path $tasks) { Write-Output "tasks.md already exists: $tasks"; exit 0 }
# Very small generator: create tasks placeholder based on spec user stories
$spec = Join-Path $SpecsDir 'spec.md'
$front = @'
---
feature: "Auto-generated"
phase: "Phase 2 - Implementation"
date: "{DATE}"
total_tasks: 1
p1_tasks: 1
---
'@
$front = $front -replace '{DATE}', (Get-Date -Format 'yyyy-MM-dd')
$body = @'
# Task List

## P1 Tasks

### Task T-001: Implement core (Priority: P1)

**Description**: Placeholder task - implement core feature.

**Acceptance Criteria**:
- [ ] Implemented
'@
Set-Content -Path $tasks -Value ($front + "`n" + $body) -Force
Write-Output "Created placeholder tasks.md at $tasks"