#!/usr/bin/env pwsh
param([string[]]$Args)
# Simple CLI wrapper
switch ($Args[0]) {
    'init' { . "$PSScriptRoot/setup-plan.ps1" -Json }
    'research' { . "$PSScriptRoot/generate-research.ps1" -PlanPath './plan.md' }
    'design' { . "$PSScriptRoot/generate-data-model.ps1" }
    'tasks' { . "$PSScriptRoot/generate-tasks.ps1" }
    default { Write-Output "Usage: speckit.ps1 init|research|design|tasks" }
}
