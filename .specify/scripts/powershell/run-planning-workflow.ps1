#!/usr/bin/env pwsh
param([string]$FeatureDescription)
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
# Run setup to ensure spec & plan exist
. "$PSScriptRoot/setup-plan.ps1" -Json -FeatureDescription $FeatureDescription
# Run research
. "$PSScriptRoot/generate-research.ps1"
Write-Output "PAUSE: Please review research.md and press Enter to continue..."
Read-Host
# Run design generators
. "$PSScriptRoot/generate-data-model.ps1"
. "$PSScriptRoot/generate-contracts.ps1"
. "$PSScriptRoot/generate-quickstart.ps1"
# Generate tasks
. "$PSScriptRoot/generate-tasks.ps1"
# Update agent context
. "$PSScriptRoot/update-agent-context.ps1" -AgentType copilot
# Validate constitution
. "$PSScriptRoot/validate-constitution.ps1"
Write-Output "Workflow complete"