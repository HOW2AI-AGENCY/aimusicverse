---
feature: "Task Planning System"
phase: "Phase 2 - Implementation"
date: "2025-12-02"
total_tasks: 15
p1_tasks: 8
p2_tasks: 5
p3_tasks: 2
---

# Task List: Task Planning System

## Overview

This task breakdown implements an automated system for translating feature specifications into structured implementation plans and actionable tasks. Tasks are organized by priority matching the user stories in spec.md, following INVEST principles for independence, value delivery, and testability.

**Implementation Strategy**: Start with P1 tasks to deliver core functionality (automated planning workflow). P2 tasks add validation and tooling. P3 tasks enhance developer experience but are not critical for initial launch.

---

## P1 Tasks (Core Functionality)

### Task T-001: Enhance setup-plan.ps1 to support spec generation (Priority: P1)

**Status**: [X] Completed

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Extend the existing `.specify/scripts/powershell/setup-plan.ps1` script to generate both `plan.md` (already done) and `spec.md` from the spec-template.md. Add parameter to accept feature description and automatically fill in basic frontmatter.

**Acceptance Criteria**:
- [ ] Script accepts `-FeatureDescription` parameter
- [ ] Script generates unique feature branch name from description
- [ ] Script copies and populates `spec-template.md` to `specs/[feature]/spec.md`
- [ ] Script copies and populates `plan-template.md` to `specs/[feature]/plan.md`
- [ ] Frontmatter (title, branch, date, status) automatically filled
- [ ] JSON output includes FEATURE_SPEC and IMPL_PLAN paths
- [ ] Works on Windows, macOS, Linux (PowerShell Core)

**Dependencies**: None

**Estimate**: 1 day

**Constitution Check**:
- **Security**: N/A (local file operations only)
- **Testing**: Manual testing on all 3 platforms, verify file generation
- **Observability**: Script outputs progress messages and error details

**Implementation Notes**:
- Reuse existing setup-plan.ps1 structure
- Add feature name sanitization (remove special chars, lowercase, hyphens)
- Use `Get-Date -Format 'yyyy-MM-dd'` for ISO dates
- Test with various feature descriptions including spaces, quotes, non-ASCII

---

### Task T-002: Create research.md generation script (Priority: P1)

**Status**: [X] Completed

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Create a PowerShell script that scans `plan.md` for "NEEDS CLARIFICATION" markers and generates a `research.md` template with sections for each unknown. The template should guide developers to document decisions, rationale, and alternatives.

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/powershell/generate-research.ps1` created
- [ ] Script accepts `-PlanPath` parameter
- [ ] Script extracts all "NEEDS CLARIFICATION" text using regex
- [ ] Script generates research.md with one Research Item per unknown
- [ ] Template includes Decision, Rationale, Alternatives, Implementation Details, References sections
- [ ] Script handles zero unknowns gracefully (skip research phase)
- [ ] Output message indicates number of research items created

**Dependencies**: T-001 (needs plan.md to exist)

**Estimate**: 1 day

**Constitution Check**:
- **Security**: N/A (read/write local files)
- **Testing**: Unit test with sample plan.md containing various NEEDS CLARIFICATION patterns
- **Observability**: Log each extracted unknown and created research item

**Implementation Notes**:
- Regex pattern: `NEEDS CLARIFICATION: ([^\]]+)`
- Group related unknowns (e.g., all "dependency" questions)
- Pre-fill some obvious sections (e.g., for language choice, list common options)
- Reference constitution.md for architecture/testing guidance

---

### Task T-003: Create data-model.md generation script (Priority: P1)

**Status**: [X] Completed

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Create a script that extracts entities from `spec.md` (user stories and functional requirements) and generates `data-model.md` with entity definitions following the constitution's database standards (id, created_at, updated_at, RLS policies).

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/powershell/generate-data-model.ps1` created
- [ ] Script accepts `-SpecPath` parameter
- [ ] Script extracts nouns from user stories and requirements (basic NLP)
- [ ] Script generates entity sections with standard fields
- [ ] Each entity includes: Description, Storage Location, Fields, Relationships, Validation, RLS Policies
- [ ] Script applies snake_case naming convention for database entities
- [ ] Output includes entity relationship diagram (ASCII or Mermaid)

**Dependencies**: T-001 (needs spec.md to exist)

**Estimate**: 1.5 days

**Constitution Check**:
- **Security**: Automatically includes RLS policy template for user-data tables
- **Testing**: Test with various spec.md files (0 entities, 1 entity, 10 entities)
- **Observability**: Log extracted entities and relationships

**Implementation Notes**:
- Simple noun extraction: look for phrases like "as a [user]", "create [entity]", "manage [entities]"
- Don't over-engineer NLP - manual refinement expected
- Include TODO comments for developer to fill in details
- Reference DATABASE.md for Supabase conventions

---

### Task T-004: Create OpenAPI contract generation script (Priority: P1)

**Status**: [X] Completed

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Create a script that generates OpenAPI 3.0 YAML files in `contracts/` directory by mapping user actions from acceptance scenarios to REST API endpoints with request/response schemas.

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/powershell/generate-contracts.ps1` created
- [ ] Script accepts `-SpecPath` and `-OutputDir` parameters
- [ ] Script extracts actions from Given/When/Then scenarios
- [ ] Script maps actions to HTTP methods (GET, POST, PUT, DELETE)
- [ ] Script generates OpenAPI YAML with paths, schemas, examples
- [ ] Generated contracts include security schemes (Supabase auth)
- [ ] Script creates contracts/ directory if not exists
- [ ] Output is valid OpenAPI 3.0 (can be validated with swagger-cli)

**Dependencies**: T-001 (needs spec.md)

**Estimate**: 2 days

**Constitution Check**:
- **Security**: Include authentication requirements in all endpoints
- **Testing**: Validate generated YAML with `npx @apidevtools/swagger-cli validate`
- **Observability**: Log each endpoint generated

**Implementation Notes**:
- Parse scenarios: "When they [action]" → endpoint
- Action mapping: "click Generate" → POST /api/music/generate, "view library" → GET /api/music/tracks
- Use data-model.md entities for schema definitions
- Include common error responses (400, 401, 500)
- Add placeholder examples for developer to refine

---

### Task T-005: Create quickstart.md generation script (Priority: P1)

**Status**: [X] Completed

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Create a script that generates a developer-friendly quickstart guide from the completed plan, research, data-model, and contracts. The guide should provide step-by-step implementation instructions with code examples.

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/powershell/generate-quickstart.ps1` created
- [ ] Script accepts `-SpecsDir` parameter (directory containing all artifacts)
- [ ] Script aggregates information from plan.md, research.md, data-model.md, contracts/
- [ ] Generated quickstart includes: Overview, Prerequisites, Architecture, Steps, Examples, Testing, References
- [ ] Code examples extracted from research.md and data-model.md
- [ ] Links to relevant files and documentation
- [ ] Formatted as readable Markdown with proper sections

**Dependencies**: T-002, T-003, T-004 (needs all Phase 1 artifacts)

**Estimate**: 1.5 days

**Constitution Check**:
- **Security**: Include security best practices in implementation steps
- **Testing**: Include testing guide section
- **Observability**: Include observability requirements

**Implementation Notes**:
- Template structure similar to specs/copilot/create-task-plan/quickstart.md
- Extract key decisions from research.md
- List entities from data-model.md
- Reference endpoints from contracts/
- Add common pitfalls section with constitution reminders

---

### Task T-006: Create tasks.md generation script (Priority: P1)

**Status**: [X] Completed

**User Story**: User Story 2 - Task Breakdown Generation

**Description**: Create a script that generates `tasks.md` from the complete implementation plan by breaking down each user story into granular, implementable tasks following INVEST principles. Tasks should include setup, implementation, testing, and polish.

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/powershell/generate-tasks.ps1` created
- [ ] Script accepts `-SpecsDir` parameter
- [ ] Script reads spec.md user stories and plan.md technical context
- [ ] Script generates tasks for each user story (setup, core, testing, polish)
- [ ] Each task includes: ID, Title, Priority, User Story, Description, Acceptance Criteria, Dependencies, Estimate, Constitution Check
- [ ] Tasks follow INVEST principles (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- [ ] Estimates are 0.5-2 days max (enforced)
- [ ] Constitution-mandated tasks auto-generated (security, observability)
- [ ] Output includes frontmatter with task counts by priority

**Dependencies**: T-001, T-002, T-003 (needs spec, plan, research, data-model)

**Estimate**: 2 days

**Constitution Check**:
- **Security**: Automatically include security review tasks for auth/data handling
- **Testing**: P1 user stories automatically get TDD test tasks
- **Observability**: All features get logging/metrics tasks

**Implementation Notes**:
- Task template pattern: "[Verb] [Entity] [Detail]" (e.g., "Create MusicTrack database schema")
- Priority inheritance: P1 user story → all tasks P1
- Dependency inference: database tasks before API tasks, API before UI
- Reference constitution for task categories (security, performance, i18n)
- Task IDs: T-001, T-002, etc. (sequential)

---

### Task T-007: Create constitution check validator (Priority: P1)

**Status**: [X] Completed

**User Story**: User Story 3 - Constitution Compliance Validation

**Description**: Create a script that validates a plan.md against the 8 constitution principles and outputs a gate status (Approved, Warning, Blocked). The validator should check for P1 testing requirements, security considerations, observability specs, etc.

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/powershell/validate-constitution.ps1` created
- [ ] Script accepts `-PlanPath` parameter
- [ ] Script checks all 8 principles with specific validation rules
- [ ] Script outputs gate status: 🟢 Approved, ⚠️ Warning, 🔴 Blocked
- [ ] Script generates Constitution Check section for plan.md
- [ ] Critical violations (P1 testing missing, security unaddressed) result in Blocked
- [ ] Script provides actionable error messages for violations
- [ ] Script can re-validate after Phase 1 design

**Dependencies**: T-001 (needs plan.md)

**Estimate**: 1.5 days

**Constitution Check**:
- **Security**: Enforces security principle validation
- **Testing**: Enforces testing principle validation for P1
- **Observability**: Checks observability requirements documented

**Implementation Notes**:
- Principle 1 (Testing): Check spec.md for test requirements in P1 stories
- Principle 2 (Security): Flag auth, data handling, secrets for review
- Principle 3 (Observability): Check plan lists logs/metrics
- Principle 4 (Versioning): Check for SemVer, migration plans
- Principle 5 (Simplicity): Flag >3 projects, complex patterns (manual review)
- Principle 6 (Performance): Check performance goals defined
- Principle 7 (i18n/a11y): Check language requirements
- Principle 8 (Telegram-first): Check Mini App integration mentioned

---

### Task T-008: Integrate scripts into unified workflow command (Priority: P1)

**Status**: [X] Completed

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Create a master script that orchestrates the entire planning workflow from feature description to tasks.md, running Phase 0, Phase 1, and Phase 2 scripts in sequence with appropriate gates and validations.

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/powershell/run-planning-workflow.ps1` created
- [ ] Script accepts `-FeatureDescription` parameter
- [ ] Script runs phases sequentially: Setup → Phase 0 → Phase 1 → Phase 2
- [ ] Script pauses for manual input after Phase 0 (research completion)
- [ ] Script validates constitution before proceeding to Phase 0
- [ ] Script validates artifacts exist before moving to next phase
- [ ] Script outputs summary of generated files at end
- [ ] Script handles errors gracefully with rollback option

**Dependencies**: T-001, T-002, T-003, T-004, T-005, T-006, T-007

**Estimate**: 1 day

**Constitution Check**:
- **Security**: N/A (orchestration only)
- **Testing**: End-to-end test of full workflow with sample feature
- **Observability**: Detailed progress logging at each phase

**Implementation Notes**:
- Call setup-plan.ps1 → generate-research.ps1 → (wait for user) → generate-data-model.ps1 → generate-contracts.ps1 → generate-quickstart.ps1 → generate-tasks.ps1
- Check exit codes after each script
- Provide clear prompts for manual steps (filling research, reviewing data model)
- Store intermediate state for resume capability
- Output JSON with all generated file paths

---

## P2 Tasks (Validation & Tooling)

### Task T-009: Add JSON Schema validation to scripts (Priority: P2)

**User Story**: User Story 3 - Constitution Compliance Validation

**Description**: Integrate JSON Schema validation into generation scripts to ensure generated artifacts (plan.md, tasks.md) conform to their schemas before writing to disk. Use the schemas in contracts/ directory.

**Acceptance Criteria**:
- [ ] Install validation library (e.g., ajv-cli) in npm devDependencies
- [ ] Update generation scripts to validate against schemas
- [ ] Scripts exit with error if validation fails
- [ ] Validation errors include helpful messages (which field failed, why)
- [ ] Add npm script: `npm run validate-specs` to validate all specs/
- [ ] CI/CD integration: validate specs on PR

**Dependencies**: T-003, T-004, T-006 (schemas must exist)

**Estimate**: 1 day

**Constitution Check**:
- **Security**: N/A (validation only)
- **Testing**: Test with invalid plan.md/tasks.md (missing required fields, wrong types)
- **Observability**: Log validation results

**Implementation Notes**:
- Use ajv (JSON Schema validator) via npx
- Convert Markdown frontmatter to JSON for validation
- Schemas: plan-schema.json, task-schema.json, spec-schema.json
- Add pre-commit hook for validation (optional)

---

### Task T-010: Create agent context update script (Priority: P2)

**User Story**: User Story 4 - Agent Context Synchronization

**Description**: Create the `update-agent-context.ps1` script that extracts new technologies from plan.md and updates `.github/copilot-instructions.md` while preserving manual additions between AUTO-GENERATED markers.

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/powershell/update-agent-context.ps1` created
- [ ] Script accepts `-PlanPath` and `-AgentType` parameters
- [ ] Script extracts technologies from Technical Context section
- [ ] Script reads existing agent context file
- [ ] Script preserves content outside AUTO-GENERATED markers
- [ ] Script de-duplicates entries (don't add if already present)
- [ ] Script writes atomically (temp file + move)
- [ ] Script supports multiple agent types (copilot, cursor, etc.)

**Dependencies**: T-001 (needs plan.md)

**Estimate**: 1 day

**Constitution Check**:
- **Security**: N/A (local file updates)
- **Testing**: Test with existing agent file, verify manual additions preserved
- **Observability**: Log technologies added and skipped (duplicates)

**Implementation Notes**:
- Parse Technical Context: Language, Primary Dependencies
- Agent file path mapping: copilot → .github/copilot-instructions.md
- Markers: `<!-- AUTO-GENERATED: START -->` and `<!-- AUTO-GENERATED: END -->`
- Atomic write: write to temp file, verify, then move
- Backup agent file before update (optional)

---

### Task T-011: Add spec migration script for existing features (Priority: P2)

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Create a script that migrates existing feature directories in specs/ to the new structure, adding missing artifacts (research.md, data-model.md, contracts/, quickstart.md, tasks.md) by extracting information from existing docs.

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/powershell/migrate-existing-specs.ps1` created
- [ ] Script scans specs/ for directories with spec.md
- [ ] Script identifies missing artifacts (research.md, etc.)
- [ ] Script generates placeholder files with TODO markers
- [ ] Script adds frontmatter to existing spec.md files
- [ ] Script doesn't overwrite existing files
- [ ] Script outputs migration report (what was added per feature)

**Dependencies**: T-002, T-003, T-004, T-005, T-006

**Estimate**: 1 day

**Constitution Check**:
- **Security**: N/A (migration only)
- **Testing**: Test on copy of specs/ directory, verify no data loss
- **Observability**: Detailed migration log per feature

**Implementation Notes**:
- Iterate through specs/*/spec.md
- For each missing artifact, generate from generation scripts with "MIGRATED" note
- Extract what's possible from existing docs (PROJECT_SPECIFICATION.md, DATABASE.md)
- Leave TODOs for developer to fill in details
- Dry-run mode: show what would be done without writing

---

### Task T-012: Create CLI wrapper for easier usage (Priority: P2)

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Create a simple CLI wrapper script (`speckit` or `plan`) that provides an intuitive interface for common planning operations without remembering long script paths and parameters.

**Acceptance Criteria**:
- [ ] Script `.specify/scripts/speckit` (bash) or `speckit.ps1` created
- [ ] Commands: `speckit init [description]`, `speckit research`, `speckit design`, `speckit tasks`
- [ ] Commands map to underlying PowerShell scripts
- [ ] Help text: `speckit --help` or `speckit -h`
- [ ] Tab completion support (optional)
- [ ] Works from repository root or any subdirectory
- [ ] Colored output for better readability

**Dependencies**: T-008 (workflow must exist)

**Estimate**: 1 day

**Constitution Check**:
- **Security**: N/A (wrapper only)
- **Testing**: Test all commands with various arguments
- **Observability**: Pass through underlying script logs

**Implementation Notes**:
- `speckit init "Music Generation"` → `.specify/scripts/powershell/setup-plan.ps1 -Json`
- `speckit research` → `.specify/scripts/powershell/generate-research.ps1 -PlanPath ./plan.md`
- Auto-detect specs/ directory from current path
- Use ANSI colors for status: green (success), yellow (warning), red (error)
- Check PowerShell Core availability, suggest installation if missing

---

### Task T-013: Add templates for common feature types (Priority: P2)

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Create specialized spec templates for common feature types (API endpoint, UI component, database migration, integration) that pre-fill common sections and requirements to accelerate specification writing.

**Acceptance Criteria**:
- [ ] Template `.specify/templates/spec-template-api.md` for API features
- [ ] Template `.specify/templates/spec-template-ui.md` for UI features
- [ ] Template `.specify/templates/spec-template-database.md` for data migrations
- [ ] Template `.specify/templates/spec-template-integration.md` for third-party integrations
- [ ] setup-plan.ps1 accepts `-TemplateType` parameter to select template
- [ ] Templates include pre-filled functional requirements common to that type
- [ ] Templates reference relevant constitution principles

**Dependencies**: T-001

**Estimate**: 1 day

**Constitution Check**:
- **Security**: API template includes auth requirements, UI includes XSS prevention, DB includes RLS
- **Testing**: Each template includes appropriate testing requirements
- **Observability**: Each template includes relevant observability requirements

**Implementation Notes**:
- API template: pre-fill FR for authentication, rate limiting, error handling, OpenAPI
- UI template: pre-fill FR for accessibility, responsive design, i18n, Telegram theme
- Database template: pre-fill FR for migrations, RLS, indexes, backups
- Integration template: pre-fill FR for API keys (secrets), error handling, retries, fallbacks

---

## P3 Tasks (Nice-to-Have Enhancements)

### Task T-014: Add interactive mode for spec creation (Priority: P3)

**User Story**: User Story 1 - Automated Task Planning from Specifications

**Description**: Enhance setup-plan.ps1 to support interactive mode where the script prompts the user for feature details (name, description, type, user stories) and fills in the spec.md interactively, reducing need for manual editing.

**Acceptance Criteria**:
- [ ] setup-plan.ps1 accepts `-Interactive` flag
- [ ] Script prompts for: feature name, description, feature type (API/UI/DB/Integration)
- [ ] Script prompts for: number of user stories, priority for each
- [ ] Script prompts for: key entities (if applicable)
- [ ] Script generates spec.md with filled-in sections based on inputs
- [ ] Script uses appropriate template based on feature type
- [ ] Interactive mode skippable via environment variable (CI/CD)

**Dependencies**: T-001, T-013

**Estimate**: 1 day

**Constitution Check**:
- **Security**: N/A (input gathering only)
- **Testing**: Test interactive prompts with various inputs
- **Observability**: Log collected inputs

**Implementation Notes**:
- Use `Read-Host` for prompts
- Validate inputs (non-empty, valid priority)
- Allow multi-line input for descriptions (Ctrl+D to end)
- Save partial state if user cancels
- Provide examples in prompts (e.g., "Feature name (e.g., Music Generation):")

---

### Task T-015: Add CI/CD workflow for automated spec validation (Priority: P3)

**User Story**: User Story 3 - Constitution Compliance Validation

**Description**: Create a GitHub Actions workflow that automatically validates all specs/ artifacts on PR, checking JSON Schemas, OpenAPI contracts, constitution compliance, and reports results as PR comments.

**Acceptance Criteria**:
- [ ] Workflow `.github/workflows/validate-specs.yml` created
- [ ] Workflow triggers on PR to branches with specs/ changes
- [ ] Workflow validates all JSON Schemas (plan, task, spec)
- [ ] Workflow validates all OpenAPI contracts (swagger-cli)
- [ ] Workflow runs constitution check on modified plans
- [ ] Workflow posts comment on PR with validation results
- [ ] Workflow fails PR if critical violations found
- [ ] Workflow caches npm dependencies for speed

**Dependencies**: T-007, T-009 (validation scripts exist)

**Estimate**: 1 day

**Constitution Check**:
- **Security**: Workflow doesn't expose secrets, runs on untrusted PR code safely
- **Testing**: Test workflow on sample PR with valid/invalid specs
- **Observability**: Workflow outputs detailed logs, results in PR comment

**Implementation Notes**:
- Use `actions/checkout` to get PR code
- Install Node.js, PowerShell Core in workflow
- Run validation scripts on changed files (git diff)
- Use `peter-evans/create-or-update-comment` to post results
- Cache node_modules with `actions/cache`
- Example results comment: "✅ All specs valid | ⚠️ 2 warnings in plan.md | 🔴 1 critical violation in tasks.md"

---

## Summary and Next Steps

**Total Tasks**: 15 tasks across 3 priorities  
**P1 Tasks**: 8 tasks (core planning workflow) - ~11 days  
**P2 Tasks**: 5 tasks (validation & tooling) - ~5 days  
**P3 Tasks**: 2 tasks (enhancements) - ~2 days

**Estimated Total**: ~18 days (sequential) or ~10-15 days (with 2 developers)

**Estimation Confidence**: ±30% - Estimates assume familiarity with PowerShell and existing codebase. First-time implementation may take 20-25% longer for learning curve. Complex integrations (CI/CD, validation) have higher uncertainty.

**Implementation Order** (recommended):
1. **Week 1**: T-001 → T-002 → T-007 (setup, research, validation)
2. **Week 2**: T-003 → T-004 → T-005 (data model, contracts, quickstart)
3. **Week 3**: T-006 → T-008 → T-009 (tasks generation, workflow, validation)
4. **Week 4**: T-010 → T-011 → T-012 (agent context, migration, CLI)
5. **Optional**: T-013 → T-014 → T-015 (templates, interactive, CI/CD)

**Dependencies Visualization**:
```
T-001 (setup) → T-002 (research) → T-007 (constitution check)
    ↓              ↓
T-003 (data model)  ↓
    ↓              ↓
T-004 (contracts)  ↓
    ↓              ↓
T-005 (quickstart) ↓
    ↓              ↓
T-006 (tasks) ←────┘
    ↓
T-008 (workflow) → T-009 (validation) → T-015 (CI/CD)
    ↓                  ↓
T-010 (agent ctx)  T-011 (migration) → T-013 (templates) → T-014 (interactive)
    ↓
T-012 (CLI)
```

**After Implementation**:
1. Test full workflow with a real feature (e.g., "Audio Player Controls")
2. Document lessons learned and update quickstart.md
3. Train team on new planning system
4. Migrate existing features in specs/ (T-011)
5. Monitor usage and gather feedback for improvements

---

**Tasks Status**: ✅ COMPLETE  
**Ready for**: Implementation kickoff, team assignment, sprint planning
