#!/usr/bin/env pwsh
<<<<<<< HEAD
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
=======
<#
.SYNOPSIS
    Generates research.md template from "NEEDS CLARIFICATION" markers in plan.md
    
.DESCRIPTION
    Task T-002: Create research.md generation script
    
    This script scans a plan.md file for "NEEDS CLARIFICATION" markers and generates
    a research.md template with sections for each unknown. The template guides
    developers to document decisions, rationale, and alternatives.
    
    Features:
    - Extracts all "NEEDS CLARIFICATION: <text>" patterns using regex
    - Groups related unknowns by category
    - Generates structured research.md with Decision/Rationale/Alternatives sections
    - Handles zero unknowns gracefully
    - Pre-fills common sections based on unknown type
    
.PARAMETER PlanPath
    Path to the plan.md file to scan for unknowns
    
.PARAMETER OutputPath
    Optional. Path where research.md will be created. Defaults to same directory as plan.md
    
.PARAMETER Force
    Optional. Overwrite existing research.md if it exists
    
.EXAMPLE
    ./generate-research.ps1 -PlanPath ./specs/my-feature/plan.md
    
.EXAMPLE
    ./generate-research.ps1 -PlanPath ./plan.md -OutputPath ./research.md -Force
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateScript({Test-Path $_ -PathType Leaf})]
    [string]$PlanPath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# Import common utilities
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir/common.ps1"

# Determine output path
if (-not $OutputPath) {
    $planDir = Split-Path -Parent $PlanPath
    $OutputPath = Join-Path $planDir "research.md"
}

# Check if output file exists and Force is not set
if ((Test-Path $OutputPath) -and -not $Force) {
    Write-Error "research.md already exists at $OutputPath. Use -Force to overwrite."
    exit 1
}

# Read plan.md content
Write-Host "📖 Reading plan from: $PlanPath" -ForegroundColor Cyan
$planContent = Get-Content -Path $PlanPath -Raw

# Extract all "NEEDS CLARIFICATION" markers
$clarificationPattern = 'NEEDS CLARIFICATION:\s*([^\n\r]+)'
$matches = [regex]::Matches($planContent, $clarificationPattern)

if ($matches.Count -eq 0) {
    Write-Host "✅ No NEEDS CLARIFICATION markers found in plan.md" -ForegroundColor Green
    Write-Host "🎉 No research phase needed - plan is complete!" -ForegroundColor Green
    exit 0
}

Write-Host "🔍 Found $($matches.Count) research items" -ForegroundColor Yellow

# Group unknowns by category (simple keyword matching)
$categories = @{
    'Technology' = @()
    'Architecture' = @()
    'Dependencies' = @()
    'Security' = @()
    'Testing' = @()
    'Performance' = @()
    'Other' = @()
}

foreach ($match in $matches) {
    $unknown = $match.Groups[1].Value.Trim()
    
    # Categorize based on keywords
    $category = 'Other'
    if ($unknown -match 'library|framework|language|technology|tool') {
        $category = 'Technology'
    } elseif ($unknown -match 'architecture|structure|pattern|design') {
        $category = 'Architecture'
    } elseif ($unknown -match 'dependency|package|module|import') {
        $category = 'Dependencies'
    } elseif ($unknown -match 'security|auth|permission|encryption') {
        $category = 'Security'
    } elseif ($unknown -match 'test|testing|validation|verification') {
        $category = 'Testing'
    } elseif ($unknown -match 'performance|optimization|speed|latency') {
        $category = 'Performance'
    }
    
    $categories[$category] += $unknown
}

# Generate research.md content
$researchContent = @"
---
feature: "$(Split-Path -Leaf (Split-Path -Parent $PlanPath))"
phase: "Phase 0 - Research"
date: "$(Get-Date -Format 'yyyy-MM-dd')"
status: "in-progress"
total_items: $($matches.Count)
---

# Research Items

**Purpose**: Document research, decisions, and rationale for unknowns identified in plan.md

**Status**: 🟡 In Progress - $($matches.Count) items need research

**Instructions**: For each research item below:
1. Fill in the **Decision** section with your chosen approach
2. Explain the **Rationale** behind this decision
3. List **Alternatives** you considered and why they were rejected
4. Add **Implementation Details** (code examples, configuration, etc.)
5. Include **References** (docs, articles, GitHub issues, etc.)

---

"@

# Add research items by category
$itemNumber = 1
foreach ($category in $categories.Keys | Sort-Object) {
    $items = $categories[$category]
    if ($items.Count -eq 0) { continue }
    
    $researchContent += @"

## 📋 $category

"@

    foreach ($unknown in $items) {
        $researchContent += @"

### Research Item ${itemNumber}: $unknown

**Status**: ⏳ Not Started

#### Decision

<!-- What approach/technology/solution did you choose? -->

**Decision**: 

#### Rationale

<!-- Why did you choose this approach? What problem does it solve? -->

**Reasoning**:
- 
- 
- 

#### Alternatives Considered

<!-- What other options did you evaluate? -->

| Alternative | Pros | Cons | Reason for Rejection |
|------------|------|------|---------------------|
| Option 1 | | | |
| Option 2 | | | |

#### Implementation Details

<!-- How will this be implemented? Include code examples, configuration, etc. -->

``````typescript
// TODO: Add implementation example
``````

#### References

<!-- Links to documentation, articles, GitHub issues, etc. -->

- [ ] Documentation: 
- [ ] Examples: 
- [ ] Related issues: 

---

"@
        $itemNumber++
    }
}

# Add summary section
$researchContent += @"

## 📊 Summary

**Total Research Items**: $($matches.Count)
**By Category**:
"@

foreach ($category in $categories.Keys | Sort-Object) {
    if ($categories[$category].Count -gt 0) {
        $researchContent += "`n- **$category**: $($categories[$category].Count) items"
    }
}

$researchContent += @"


## ✅ Checklist

Use this checklist to track research completion:

"@

for ($i = 1; $i -le $matches.Count; $i++) {
    $researchContent += "- [ ] Research Item ${i}`n"
}

$researchContent += @"

---

## 🎯 Next Steps

After completing all research items:

1. Review all decisions with the team
2. Update plan.md to remove "NEEDS CLARIFICATION" markers
3. Update data-model.md with any new entities or schema changes
4. Update contracts/ with any API changes
5. Run ``./validate-constitution.ps1`` to ensure compliance
6. Proceed to Phase 1 implementation

---

**Last Updated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

# Write research.md
Write-Host "📝 Writing research.md to: $OutputPath" -ForegroundColor Cyan
$researchContent | Out-File -FilePath $OutputPath -Encoding UTF8

# Print summary
Write-Host ""
Write-Host "✅ Research template generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  - Total research items: $($matches.Count)" -ForegroundColor White
foreach ($category in $categories.Keys | Sort-Object) {
    if ($categories[$category].Count -gt 0) {
        Write-Host "  - $category`: $($categories[$category].Count)" -ForegroundColor White
    }
}
Write-Host ""
Write-Host "📁 Output file: $OutputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Fill in research items in research.md" -ForegroundColor White
Write-Host "  2. Update plan.md to remove NEEDS CLARIFICATION markers" -ForegroundColor White
Write-Host "  3. Run ./generate-data-model.ps1 after research is complete" -ForegroundColor White
Write-Host ""

exit 0
>>>>>>> 3ee83eb54b4438d9e3583afb733914693dd05125
