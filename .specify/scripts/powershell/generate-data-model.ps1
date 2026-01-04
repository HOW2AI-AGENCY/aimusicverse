#!/usr/bin/env pwsh
<<<<<<< HEAD
param([string]$SpecPath)
. "$PSScriptRoot/common.ps1"
$paths = Get-FeaturePathsEnv
if (-not $SpecPath) { $SpecPath = $paths.FEATURE_SPEC }
$dataModel = $paths.DATA_MODEL
if (Test-Path $dataModel) { Write-Output "data-model.md already exists: $dataModel"; exit 0 }
$content = "# Data Model`n`nThis is an auto-generated placeholder. Please review and edit.`n`n## Entities`n`n- TODO: extract entities from spec.md`
"
Set-Content -Path $dataModel -Value $content -Force
Write-Output "Created placeholder data-model.md at $dataModel"
=======
<#
.SYNOPSIS
    Generates data-model.md from entities extracted from spec.md
    
.DESCRIPTION
    Task T-003: Create data-model.md generation script
    
    This script extracts entities (nouns) from spec.md user stories and functional
    requirements using basic NLP patterns, then generates a structured data-model.md
    with entity definitions following database standards (id, created_at, updated_at, RLS).
    
    Features:
    - Extracts nouns from user stories ("as a [user]", "create [entity]", "manage [entities]")
    - Generates entity sections with standard fields
    - Applies snake_case naming convention
    - Includes Description, Storage Location, Fields, Relationships, Validation, RLS Policies
    - Creates ASCII entity relationship diagram
    
.PARAMETER SpecPath
    Path to the spec.md file containing user stories
    
.PARAMETER OutputPath
    Optional. Path where data-model.md will be created. Defaults to same directory as spec.md
    
.PARAMETER Force
    Optional. Overwrite existing data-model.md if it exists
    
.EXAMPLE
    ./generate-data-model.ps1 -SpecPath ./specs/my-feature/spec.md
    
.EXAMPLE
    ./generate-data-model.ps1 -SpecPath ./spec.md -OutputPath ./data-model.md -Force
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateScript({Test-Path $_ -PathType Leaf})]
    [string]$SpecPath,
    
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
    $specDir = Split-Path -Parent $SpecPath
    $OutputPath = Join-Path $specDir "data-model.md"
}

# Check if output file exists and Force is not set
if ((Test-Path $OutputPath) -and -not $Force) {
    Write-Error "data-model.md already exists at $OutputPath. Use -Force to overwrite."
    exit 1
}

# Read spec.md content
Write-Host "📖 Reading spec from: $SpecPath" -ForegroundColor Cyan
$specContent = Get-Content -Path $SpecPath -Raw

# Helper function to convert to snake_case
function ConvertTo-SnakeCase {
    param([string]$text)
    
    # Remove non-alphanumeric except spaces and underscores
    $text = $text -replace '[^a-zA-Z0-9\s_]', ''
    # Convert camelCase to snake_case
    $text = $text -replace '([a-z0-9])([A-Z])', '$1_$2'
    # Convert spaces to underscores
    $text = $text -replace '\s+', '_'
    # Lowercase
    $text = $text.ToLower()
    # Remove multiple underscores
    $text = $text -replace '_+', '_'
    # Trim underscores
    $text = $text.Trim('_')
    
    return $text
}

# Extract entities using common patterns
Write-Host "🔍 Extracting entities from user stories..." -ForegroundColor Cyan

$entities = @{}

# Pattern 1: "as a [entity]" or "As a [entity]"
$asPattern = 'as a ([a-z\s]+)(?:,|\.|\s)'
$asMatches = [regex]::Matches($specContent, $asPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
foreach ($match in $asMatches) {
    $entity = $match.Groups[1].Value.Trim()
    if ($entity -and $entity.Length -gt 2 -and $entity.Length -lt 30) {
        $snakeName = ConvertTo-SnakeCase $entity
        if (-not $entities.ContainsKey($snakeName)) {
            $entities[$snakeName] = @{
                DisplayName = $entity
                SnakeName = $snakeName
                Source = 'User Story (as a ...)'
                Fields = @()
            }
        }
    }
}

# Pattern 2: "create [entity]", "manage [entity]", "view [entity]", "update [entity]", "delete [entity]"
$crudPatterns = @(
    'create (?:a |an )?([a-z\s]+?)(?:\s|,|\.|$)',
    'manage (?:a |an )?([a-z\s]+?)(?:\s|,|\.|$)',
    'view (?:a |an )?([a-z\s]+?)(?:\s|,|\.|$)',
    'update (?:a |an )?([a-z\s]+?)(?:\s|,|\.|$)',
    'delete (?:a |an )?([a-z\s]+?)(?:\s|,|\.|$)',
    'add (?:a |an )?([a-z\s]+?)(?:\s|,|\.|$)',
    'remove (?:a |an )?([a-z\s]+?)(?:\s|,|\.|$)'
)

foreach ($pattern in $crudPatterns) {
    $matches = [regex]::Matches($specContent, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    foreach ($match in $matches) {
        $entity = $match.Groups[1].Value.Trim()
        # Remove common words
        $entity = $entity -replace '\b(new|own|existing|their|my|the|a|an)\b', ''
        $entity = $entity.Trim()
        
        if ($entity -and $entity.Length -gt 2 -and $entity.Length -lt 30 -and $entity -notmatch '\d') {
            $snakeName = ConvertTo-SnakeCase $entity
            if (-not $entities.ContainsKey($snakeName)) {
                $entities[$snakeName] = @{
                    DisplayName = $entity
                    SnakeName = $snakeName
                    Source = 'CRUD Operations'
                    Fields = @()
                }
            }
        }
    }
}

# Remove common non-entity words
$excludeList = @('user', 'system', 'data', 'information', 'details', 'item', 'thing', 'page', 'screen', 'view', 'button', 'click')
$filteredEntities = @{}
foreach ($key in $entities.Keys) {
    if ($key -notin $excludeList) {
        $filteredEntities[$key] = $entities[$key]
    }
}
$entities = $filteredEntities

if ($entities.Count -eq 0) {
    Write-Host "⚠️  No entities found in spec.md" -ForegroundColor Yellow
    Write-Host "📝 Creating minimal data-model.md template" -ForegroundColor Yellow
}

Write-Host "✅ Found $($entities.Count) potential entities" -ForegroundColor Green

# Generate data-model.md content
$dataModelContent = @"
---
feature: "$(Split-Path -Leaf (Split-Path -Parent $SpecPath))"
phase: "Phase 1 - Design"
date: "$(Get-Date -Format 'yyyy-MM-dd')"
status: "draft"
entities: $($entities.Count)
---

# Data Model

**Purpose**: Define database schema, entities, relationships, and data validation rules

**Status**: 📝 Draft - Auto-generated from spec.md, needs manual review and refinement

**Database**: PostgreSQL (Lovable Cloud/Supabase)

**Conventions**:
- All tables use ``snake_case`` naming
- Standard fields: ``id`` (UUID), ``created_at`` (timestamptz), ``updated_at`` (timestamptz)
- Row Level Security (RLS) enabled on all tables with user data
- Foreign keys use ``ON DELETE CASCADE`` or ``ON DELETE SET NULL`` as appropriate

---

## 📋 Entities Overview

"@

if ($entities.Count -gt 0) {
    $entityList = $entities.GetEnumerator() | ForEach-Object { $_.Value.SnakeName }
    $dataModelContent += "**Identified Entities** ($($entities.Count)):`n`n"
    foreach ($entityName in $entityList) {
        $entity = $entities[$entityName]
        $dataModelContent += "- ``$($entity.SnakeName)`` - $($entity.DisplayName) ($($entity.Source))`n"
    }
} else {
    $dataModelContent += "**No entities automatically detected.** Please define your entities below.`n"
}

$dataModelContent += @"


---

## 🗂️ Entity Definitions

"@

if ($entities.Count -gt 0) {
    foreach ($entityName in ($entities.GetEnumerator() | ForEach-Object { $_.Value.SnakeName } | Sort-Object)) {
        $entity = $entities[$entityName]
        $tableName = $entity.SnakeName
        
        $dataModelContent += @"


### Entity: ``$tableName``

**Description**: 
<!-- TODO: Describe what this entity represents and its purpose -->

**Storage**: PostgreSQL table ``public.$tableName``

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ``id`` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| ``user_id`` | UUID | NOT NULL, REFERENCES auth.users(id) | Owner of this record |
<!-- TODO: Add specific fields for this entity -->
| ``created_at`` | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| ``updated_at`` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

#### Relationships

<!-- TODO: Define relationships with other entities -->

- **Belongs to**: 
  - ``auth.users`` via ``user_id``
- **Has many**: 
  - (define related entities)
- **Many to many**: 
  - (define junction tables if needed)

#### Indexes

``````sql
-- Primary key index (auto-created)
CREATE INDEX idx_${tableName}_user ON public.$tableName(user_id);
CREATE INDEX idx_${tableName}_created ON public.$tableName(created_at DESC);
``````

#### Validation Rules

<!-- TODO: Define business logic validation rules -->

- [ ] ``user_id`` must be valid and authenticated
- [ ] (add field-specific validations)

#### RLS Policies

``````sql
-- Enable RLS
ALTER TABLE public.$tableName ENABLE ROW LEVEL SECURITY;

-- Users can view their own records
CREATE POLICY "Users can view own $tableName"
  ON public.$tableName FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can insert own $tableName"
  ON public.$tableName FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update own $tableName"
  ON public.$tableName FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Users can delete own $tableName"
  ON public.$tableName FOR DELETE
  USING (auth.uid() = user_id);
``````

---

"@
    }
} else {
    $dataModelContent += @"


### Entity: ``example_entity``

**Description**: 
<!-- Describe what this entity represents -->

**Storage**: PostgreSQL table ``public.example_entity``

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ``id`` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| ``user_id`` | UUID | NOT NULL, REFERENCES auth.users(id) | Owner |
| ``name`` | TEXT | NOT NULL | Name of the entity |
| ``created_at`` | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| ``updated_at`` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

"@
}

# Add ER Diagram section
$dataModelContent += @"

## 📊 Entity Relationship Diagram

``````mermaid
erDiagram
    auth_users ||--o{ ENTITY1 : owns
    ENTITY1 ||--o{ ENTITY2 : has
    
    auth_users {
        uuid id PK
        text email
        timestamptz created_at
    }
    
"@

if ($entities.Count -gt 0) {
    foreach ($entityName in ($entities.GetEnumerator() | ForEach-Object { $_.Value.SnakeName } | Sort-Object)) {
        $dataModelContent += @"
    $entityName {
        uuid id PK
        uuid user_id FK
        timestamptz created_at
        timestamptz updated_at
    }
    
"@
    }
}

$dataModelContent += @"
``````

<!-- TODO: Update the ER diagram to reflect actual relationships -->

---

## 🔒 Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- ✅ Users can only access their own data (``user_id = auth.uid()``)
- ✅ Public data requires explicit ``is_public`` flag
- ✅ Admin access controlled separately

### Data Validation

- ✅ Foreign key constraints prevent orphaned records
- ✅ NOT NULL constraints on required fields
- ✅ CHECK constraints for data integrity
- ✅ Unique constraints where appropriate

---

## 🚀 Migration Strategy

### Initial Migration

``````sql
-- Create tables in order (dependencies first)
-- 1. Independent tables (no foreign keys)
-- 2. Dependent tables (with foreign keys)
-- 3. Junction tables (many-to-many)
-- 4. Indexes
-- 5. RLS policies
``````

### Rollback Plan

``````sql
-- Drop tables in reverse order
-- Keep data backups before migration
``````

---

## ✅ Checklist

- [ ] All entities reviewed and refined
- [ ] Relationships defined correctly
- [ ] Indexes added for performance
- [ ] RLS policies tested
- [ ] Validation rules documented
- [ ] Migration scripts created
- [ ] ER diagram updated

---

**Last Updated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

<!-- TODO: Remove this comment after manual review and refinement -->
**⚠️  IMPORTANT**: This data model was auto-generated. Please review carefully and:
1. Add missing fields specific to each entity
2. Define actual relationships between entities
3. Update ER diagram to reflect real structure
4. Add business logic validation rules
5. Test RLS policies thoroughly
"@

# Write data-model.md
Write-Host "📝 Writing data-model.md to: $OutputPath" -ForegroundColor Cyan
$dataModelContent | Out-File -FilePath $OutputPath -Encoding UTF8

# Print summary
Write-Host ""
Write-Host "✅ Data model template generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  - Entities detected: $($entities.Count)" -ForegroundColor White
if ($entities.Count -gt 0) {
    foreach ($entityName in ($entities.GetEnumerator() | ForEach-Object { $_.Value.SnakeName } | Sort-Object)) {
        Write-Host "    • $entityName" -ForegroundColor Gray
    }
}
Write-Host ""
Write-Host "📁 Output file: $OutputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review and refine entity definitions" -ForegroundColor White
Write-Host "  2. Add entity-specific fields" -ForegroundColor White
Write-Host "  3. Define relationships accurately" -ForegroundColor White
Write-Host "  4. Update ER diagram" -ForegroundColor White
Write-Host "  5. Run ./generate-contracts.ps1 after data model is complete" -ForegroundColor White
Write-Host ""

exit 0
>>>>>>> 3ee83eb54b4438d9e3583afb733914693dd05125
