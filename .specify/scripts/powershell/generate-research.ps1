#!/usr/bin/env pwsh
param(
    [string]$PlanPath
)
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
if (-not $PlanPath) { $PlanPath = $paths.IMPL_PLAN }
$research = $paths.RESEARCH
if (-not (Test-Path $PlanPath)) { Write-Output "Plan not found: $PlanPath"; exit 1 }
$planText = Get-Content $PlanPath -Raw
$matches = [regex]::Matches($planText, 'NEEDS CLARIFICATION[:\-\s]*([^\n\r]+)', 'IgnoreCase')
if ($matches.Count -eq 0) {
    New-Item -ItemType File -Path $research -Force | Out-Null
    Set-Content -Path $research -Value "# Research Document`n`nNo research items found.`n"
    Write-Output "No NEEDS CLARIFICATION found; created empty research.md"
    exit 0
}
$sb = "# Research Document`n`n"
$index = 1
foreach ($m in $matches) {
    $item = $m.Groups[1].Value.Trim()
    $entry = @'
## Research Item {IDX}: {ITEM}

### Decision: TBD

**Rationale**: TBD

**Alternatives Considered**:
1. TBD

**Implementation Details**: TBD

---
'@
    $entry = $entry -replace '{IDX}', $index
    $entry = $entry -replace '{ITEM}', ($item -replace '"','\"')
    $sb += $entry
    $index++
}
Set-Content -Path $research -Value $sb -Force
Write-Output "Generated research.md with $($matches.Count) items at $research"