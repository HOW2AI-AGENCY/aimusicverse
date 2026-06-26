#!/usr/bin/env pwsh
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
