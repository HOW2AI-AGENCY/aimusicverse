# Data Model: Task Planning System

**Feature**: Task Planning and Management System  
**Phase**: Phase 1 - Design  
**Date**: 2025-12-02  
**Status**: Draft

## Overview

This document defines the data entities for the task planning system. Since this is a file-based system (not database-backed), entities are represented as structured documents (Markdown with frontmatter) and their relationships are defined through file system conventions and cross-references.

---

## Entity 1: FeatureSpecification

### Description
Represents a complete feature specification written by a developer or product manager. Contains user stories, requirements, and success criteria.

### Storage Location
`specs/[feature-name]/spec.md`

### Fields (Frontmatter)

- `title` (string, required) - Feature name
- `branch` (string, required) - Git branch name (e.g., "copilot/create-task-plan")
- `created` (ISO 8601 date, required) - Creation date
- `status` (enum, required) - One of: Draft, In Progress, Complete, Archived
- `input` (string, optional) - Original user request/description
- `author` (string, optional) - Creator's GitHub username
- `reviewers` (array of strings, optional) - GitHub usernames for review

### Sections (Markdown Body)

1. **User Scenarios & Testing** (required)
   - User Story 1..N with Priority (P1, P2, P3)
   - Acceptance Scenarios (Given/When/Then)
   - Edge Cases

2. **Requirements** (required)
   - Contracts & Schemas (MANDATORY marker)
   - Functional Requirements (FR-001, FR-002, ...)
   - Key Entities (if data involved)

3. **Success Criteria** (required)
   - Measurable Outcomes (SC-001, SC-002, ...)

4. **Non-Functional Requirements** (optional)
   - Security, Performance, Reliability, etc.

5. **Technical Constraints** (optional)
6. **Out of Scope** (optional)

### Validation Rules

- Must have at least one P1 user story
- Each user story must have at least one acceptance scenario
- Functional requirements must use FR-XXX format
- Success criteria must use SC-XXX format
- NEEDS CLARIFICATION markers must be resolved before implementation

### Relationships

- **Has one** ImplementationPlan (specs/[feature-name]/plan.md)
- **Generates** multiple Tasks (specs/[feature-name]/tasks.md)
- **References** Constitution principles

### Example

```markdown
---
title: "Music Generation API"
branch: "feature/music-generation"
created: "2025-12-02"
status: "Draft"
---

# Feature Specification: Music Generation API

## User Scenarios & Testing

### User Story 1 - Generate Music (Priority: P1)
...
```

---

## Entity 2: ImplementationPlan

### Description
A structured plan generated from a FeatureSpecification that guides implementation through phases (Research, Design, Implementation).

### Storage Location
`specs/[feature-name]/plan.md`

### Fields (Frontmatter)

- `feature` (string, required) - Feature name
- `branch` (string, required) - Git branch name
- `date` (ISO 8601 date, required) - Plan creation date
- `spec_path` (string, required) - Path to spec.md
- `phase` (enum, required) - One of: Phase0 (Research), Phase1 (Design), Phase2 (Tasks)
- `status` (enum, required) - One of: Planning, In Progress, Complete

### Sections (Markdown Body)

1. **Summary** (generated from spec)
2. **Technical Context** (filled by developer/AI)
   - Language/Version
   - Primary Dependencies
   - Storage
   - Testing
   - Target Platform
   - Project Type
   - Performance Goals
   - Constraints
   - Scale/Scope
3. **Constitution Check** (validated against constitution.md)
   - Principle 1: Testing ✓/✗
   - Principle 2: Security ✓/✗
   - Principle 3: Observability ✓/✗
   - Principle 4: Versioning ✓/✗
   - Principle 5: Simplicity ✓/✗
   - Principle 6: Performance ✓/✗
   - Principle 7: i18n/a11y ✓/✗
   - Principle 8: Telegram-first ✓/✗
   - GATE STATUS
4. **Project Structure** (repository layout)
5. **Complexity Tracking** (if constitution violations need justification)

### Validation Rules

- Technical Context must have no "NEEDS CLARIFICATION" before Phase 1
- Constitution Check must pass (or have justified exceptions) before Phase 0
- Must reference valid spec.md file
- GATE STATUS must be approved to proceed to next phase

### Relationships

- **Belongs to** one FeatureSpecification
- **Has one** ResearchDocument (specs/[feature-name]/research.md)
- **Has one** DataModel (specs/[feature-name]/data-model.md)
- **Has many** APIContracts (specs/[feature-name]/contracts/*.yaml)
- **Has one** QuickstartGuide (specs/[feature-name]/quickstart.md)

### Example

```markdown
---
feature: "Music Generation API"
branch: "feature/music-generation"
date: "2025-12-02"
phase: "Phase1"
status: "In Progress"
---

# Implementation Plan: Music Generation API

## Technical Context

**Language/Version**: TypeScript 5.9+
...
```

---

## Entity 3: ResearchDocument

### Description
Documents all technical decisions, alternatives considered, and rationale. Resolves NEEDS CLARIFICATION items from Technical Context.

### Storage Location
`specs/[feature-name]/research.md`

### Fields (Frontmatter)

- `feature` (string, required) - Feature name
- `phase` (string, required) - "Phase 0 - Research and Discovery"
- `date` (ISO 8601 date, required)
- `status` (enum, required) - One of: In Progress, Complete

### Sections (Markdown Body)

1. **Executive Summary** (overview of research)
2. **Research Item 1..N** (one per unknown)
   - **Decision**: What was chosen
   - **Rationale**: Why it was chosen
   - **Alternatives Considered**: What else was evaluated
   - **Implementation Details**: Technical approach
   - **References**: Links, documentation
3. **Summary of Resolved Unknowns** (table format)
4. **Next Steps** (transition to Phase 1)

### Validation Rules

- Must have at least one research item
- Each research item must have Decision, Rationale, and Alternatives
- All NEEDS CLARIFICATION items from plan.md must be addressed
- Status must be "Complete" before Phase 1 begins

### Relationships

- **Belongs to** one ImplementationPlan
- **Resolves** NEEDS CLARIFICATION items from Technical Context

---

## Entity 4: DataModel

### Description
Defines entities, fields, relationships, and validation rules for features that involve data storage.

### Storage Location
`specs/[feature-name]/data-model.md`

### Fields (Frontmatter)

- `feature` (string, required)
- `phase` (string, required) - "Phase 1 - Design"
- `date` (ISO 8601 date, required)
- `database` (string, optional) - Database system (e.g., "PostgreSQL 16 via Supabase")

### Sections (Markdown Body)

1. **Overview** (summary of data model)
2. **Entity 1..N** (one section per entity)
   - Description
   - Storage Location (table name or file path)
   - Fields
     - Standard fields: id, created_at, updated_at
     - Custom fields with types and constraints
   - Relationships (one-to-many, many-to-many)
   - Validation rules
   - RLS Policies (for Supabase/PostgreSQL)
3. **Entity Relationship Diagram** (ASCII or Mermaid)
4. **Migration Plan** (if changing existing schema)

### Validation Rules

- All entities must have id, created_at, updated_at fields
- Foreign key relationships must reference existing entities
- RLS policies required for all user-data tables (per constitution)
- Field naming follows snake_case convention

### Relationships

- **Belongs to** one ImplementationPlan
- **Extracted from** FeatureSpecification (user stories and requirements)
- **Used by** APIContracts for schema definitions

---

## Entity 5: APIContract

### Description
Machine-readable API specification in OpenAPI 3.0 format. Defines endpoints, request/response schemas, and examples.

### Storage Location
`specs/[feature-name]/contracts/api.yaml`
`specs/[feature-name]/contracts/[resource].yaml` (multiple files allowed)

### Fields (YAML Structure)

```yaml
openapi: 3.0.0
info:
  title: "[Feature] API"
  version: "1.0.0"
  description: "API for [feature description]"
servers:
  - url: "https://api.musicverse.how2ai.world"
paths:
  /api/[resource]:
    get: # or post, put, delete
      summary: "[Action description]"
      operationId: "[camelCaseOperationName]"
      tags: ["[resource]"]
      parameters: [...]
      requestBody: [...]
      responses:
        200:
          description: "Success"
          content:
            application/json:
              schema: [...]
              examples: [...]
        400:
          description: "Bad Request"
        401:
          description: "Unauthorized"
        500:
          description: "Server Error"
components:
  schemas:
    [EntityName]:
      type: object
      required: [...]
      properties: [...]
  securitySchemes:
    supabaseAuth:
      type: http
      scheme: bearer
```

### Validation Rules

- Must be valid OpenAPI 3.0 YAML
- All endpoints must have at least one success response
- All endpoints must have error responses (400, 401, 500)
- Request/response schemas must reference components/schemas
- Examples must be provided for all endpoints
- Security schemes must be defined if authentication required

### Relationships

- **Belongs to** one ImplementationPlan
- **References** DataModel entities in schemas
- **Generated from** FeatureSpecification user scenarios

### Tools

- Validation: `npx @apidevtools/swagger-cli validate contracts/api.yaml`
- Type Generation: `npx openapi-typescript contracts/api.yaml -o types/api.ts`

---

## Entity 6: QuickstartGuide

### Description
Developer-facing documentation for implementing the feature. Provides step-by-step instructions, code examples, and common pitfalls.

### Storage Location
`specs/[feature-name]/quickstart.md`

### Fields (Frontmatter)

- `feature` (string, required)
- `phase` (string, required) - "Phase 1 - Design"
- `date` (ISO 8601 date, required)
- `audience` (string, required) - "Developers"

### Sections (Markdown Body)

1. **Overview** (what the feature does, why it matters)
2. **Prerequisites** (required knowledge, dependencies)
3. **Architecture Overview** (high-level diagram)
4. **Step-by-Step Implementation**
   - Step 1: [Setup]
   - Step 2: [Core Implementation]
   - Step 3: [Testing]
   - Step 4: [Integration]
5. **Code Examples** (with comments)
6. **Testing Guide** (how to verify implementation)
7. **Common Pitfalls** (what to avoid)
8. **References** (links to docs, related specs)

### Validation Rules

- Must have at least 3 implementation steps
- Code examples must be syntactically valid
- Must reference constitution principles where applicable
- Must link to APIContracts and DataModel

### Relationships

- **Belongs to** one ImplementationPlan
- **References** DataModel and APIContracts
- **Guides** Task implementation

---

## Entity 7: TaskList

### Description
Granular, prioritized, implementable tasks generated from the complete implementation plan. Tasks follow INVEST principles.

### Storage Location
`specs/[feature-name]/tasks.md`

### Fields (Frontmatter)

- `feature` (string, required)
- `phase` (string, required) - "Phase 2 - Implementation"
- `date` (ISO 8601 date, required)
- `total_tasks` (integer, required)
- `p1_tasks` (integer, required) - Count of P1 tasks
- `p2_tasks` (integer, required) - Count of P2 tasks
- `p3_tasks` (integer, required) - Count of P3 tasks

### Sections (Markdown Body)

1. **Overview** (summary of task breakdown)
2. **P1 Tasks** (highest priority)
   - Task 1: [Title]
   - Task 2: [Title]
   - ...
3. **P2 Tasks** (medium priority)
4. **P3 Tasks** (low priority)

Each task includes:
- **Task ID**: Unique identifier (T-001, T-002, ...)
- **Title**: Brief description (50 chars max)
- **User Story**: Link to original user story
- **Description**: What needs to be done (2-3 sentences)
- **Acceptance Criteria**: Checklist of testable outcomes
- **Dependencies**: Other task IDs (if any)
- **Estimate**: Time estimate (0.5-2 days)
- **Constitution Check**: Security/Testing/Observability notes

### Validation Rules

- Each task must follow INVEST principles
- Task IDs must be unique within feature
- Estimates must be 0.5-2 days (larger tasks must be split)
- P1 tasks must have testing tasks included
- Dependencies must reference valid task IDs
- All P1 user stories must have corresponding P1 tasks

### Relationships

- **Belongs to** one ImplementationPlan
- **Derived from** FeatureSpecification user stories
- **Implements** requirements from FeatureSpecification
- **Can be imported to** GitHub Issues

---

## Entity 8: ConstitutionCheck

### Description
Validation result of a plan against the project's constitution principles. Embedded in ImplementationPlan.

### Storage Location
Embedded in `specs/[feature-name]/plan.md` (Constitution Check section)

### Fields (Structured Checklist)

For each of 8 principles:
- `principle_id` (integer, 1-8) - Principle number
- `principle_name` (string) - e.g., "Testing", "Security"
- `status` (enum) - One of: ✓ Pass, ✗ Fail, ⚠ Warning, ? Needs Review
- `notes` (string, optional) - Explanation of status
- `exception_justification` (string, optional) - Why a violation is acceptable

Plus:
- `gate_status` (enum) - One of: 🟢 Approved, ⚠️ Warning, 🔴 Blocked
- `reviewed_by` (string, optional) - GitHub username of reviewer
- `reviewed_at` (ISO 8601 date, optional)

### Validation Rules

- All 8 principles must be checked
- Fail (✗) or Warning (⚠) must have notes explaining the issue
- If gate_status is Blocked, plan cannot proceed to Phase 0
- Critical violations (security, testing for P1) cannot be waived

### Relationships

- **Embedded in** ImplementationPlan
- **References** Constitution document (.specify/memory/constitution.md)
- **Blocks or Approves** progression to next phase

---

## Entity Relationship Diagram

```
FeatureSpecification (spec.md)
    │
    └──> ImplementationPlan (plan.md)
            ├──> ConstitutionCheck (embedded)
            ├──> ResearchDocument (research.md)
            ├──> DataModel (data-model.md)
            ├──> APIContracts (contracts/*.yaml)
            ├──> QuickstartGuide (quickstart.md)
            └──> TaskList (tasks.md)
                    └──> Task 1..N
```

---

## File System Structure

```
specs/
├── [feature-name]/
│   ├── spec.md              # FeatureSpecification
│   ├── plan.md              # ImplementationPlan
│   ├── research.md          # ResearchDocument
│   ├── data-model.md        # DataModel
│   ├── quickstart.md        # QuickstartGuide
│   ├── tasks.md             # TaskList
│   └── contracts/           # APIContracts
│       ├── api.yaml
│       └── [resource].yaml
```

---

## Migration Notes

**Current State**: Only `plan.md` exists (from template)

**Required Changes**:
1. Add frontmatter to all existing spec.md files
2. Create research.md for features currently in Phase 0
3. Generate data-model.md for features with data entities
4. Create contracts/ directory for features with APIs
5. Generate quickstart.md for completed designs
6. Generate tasks.md for features ready for implementation

**Migration Script**: `.specify/scripts/migrate-specs.ps1` (to be created)

---

## JSON Schema Definitions

For validation and tooling, JSON Schemas will be created in:
- `specs/schemas/feature-spec.schema.json`
- `specs/schemas/implementation-plan.schema.json`
- `specs/schemas/task-list.schema.json`

These can be used with tools like:
- VS Code YAML/Markdown plugins for validation
- CI/CD pipelines for automated checks
- TypeScript type generation

---

**Data Model Status**: ✅ COMPLETE  
**Next Steps**: Create API contracts and quickstart guide
