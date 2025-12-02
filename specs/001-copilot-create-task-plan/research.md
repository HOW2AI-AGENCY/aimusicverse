# Research Document: Task Planning System

**Feature**: Task Planning and Management System  
**Phase**: Phase 0 - Research and Discovery  
**Date**: 2025-12-02  
**Status**: Complete

## Executive Summary

This research document resolves all NEEDS CLARIFICATION items from the Technical Context and provides evidence-based decisions for implementing an automated task planning system. The system will integrate with the existing `.specify/` infrastructure and follow the constitution's requirements for quality, testing, and observability.

---

## Research Item 1: Planning System Architecture

### Decision: Script-based CLI with Template Processing

**Rationale**:
- The existing `.specify/scripts/powershell/setup-plan.ps1` already establishes a PowerShell-based pattern
- PowerShell Core (pwsh) is cross-platform (Windows, macOS, Linux) and available in GitHub Actions
- Template-based generation allows easy customization without code changes
- Aligns with constitution's principle of simplicity (KISS)

**Alternatives Considered**:
1. **Node.js CLI tool**: Would require additional npm dependencies and increase bundle size
2. **Python scripts**: Not part of the existing tech stack, would introduce new language requirement
3. **Custom web service**: Over-engineered for file generation tasks, violates simplicity principle

**Implementation Details**:
- Use PowerShell 7+ with `-Json` flag for structured output
- Store templates in `.specify/templates/`
- Use simple string interpolation for variable substitution
- Support both interactive and CI/CD modes

**References**:
- Existing: `.specify/scripts/powershell/setup-plan.ps1`
- PowerShell Core docs: https://docs.microsoft.com/powershell/

---

## Research Item 2: Specification Parsing and Validation

### Decision: Markdown + Frontmatter with Manual Parsing

**Rationale**:
- All existing specs use Markdown format (human-readable, git-friendly)
- Frontmatter (YAML) provides structured metadata without breaking readability
- Simple regex/string parsing is sufficient - no complex AST needed
- Allows specifications to remain readable as documentation

**Alternatives Considered**:
1. **JSON/YAML specifications**: Less readable, harder for non-technical stakeholders to write
2. **Structured format (XML)**: Verbose, not idiomatic for modern development
3. **DSL (Domain Specific Language)**: Over-engineered, requires parser maintenance

**Implementation Details**:
- Use frontmatter format: `---\nkey: value\n---`
- Parse user stories with regex: `### User Story \d+ - (.+) \(Priority: (P\d+)\)`
- Extract requirements with pattern: `- \*\*FR-\d+\*\*:`
- Flag NEEDS CLARIFICATION with uppercase marker: `[NEEDS CLARIFICATION: ...]`

**Example Pattern**:
```regex
NEEDS CLARIFICATION: ([^]]+)
```

---

## Research Item 3: Research Task Generation

### Decision: Pattern Matching on Technical Context Unknowns

**Rationale**:
- Technical Context section explicitly marks unknowns with "NEEDS CLARIFICATION"
- Each unknown maps to a research task with investigation approach
- Constitution requires all technical decisions to be documented with rationale
- Allows human judgment for complex decisions while guiding investigation

**Alternatives Considered**:
1. **AI-powered automatic research**: Not reliable enough for production decisions, requires API access
2. **Pre-defined research checklist**: Too rigid, doesn't adapt to different feature types
3. **Manual research only**: Misses opportunities for consistency and automation

**Implementation Details**:
- Scan Technical Context for "NEEDS CLARIFICATION" markers
- Generate research template with sections:
  - **Decision**: What was chosen
  - **Rationale**: Why it was chosen
  - **Alternatives considered**: What else was evaluated
  - **References**: Documentation, articles, prior art
- Group related unknowns (e.g., all language/version questions together)
- Link to constitution principles when applicable

**Research Task Categories**:
1. Technology choices (language, framework, library)
2. Architectural patterns (MVC, repository, event-driven)
3. Integration approaches (API design, data flow)
4. Performance strategies (caching, optimization)
5. Security patterns (auth, encryption, validation)

---

## Research Item 4: Data Model Generation

### Decision: Entity Extraction from Functional Requirements

**Rationale**:
- User stories and functional requirements implicitly describe domain entities
- Nouns in requirements typically map to data entities
- Verbs indicate relationships and operations
- Aligns with Domain-Driven Design (DDD) principles

**Alternatives Considered**:
1. **Manual entity modeling**: Time-consuming, inconsistent across features
2. **ER diagram first**: Requires visual tool, harder to version control
3. **Database-first design**: Premature optimization, violates constitution's simplicity principle

**Implementation Details**:
- Extract nouns from user stories: "As a [user], I want to [action] [entity]"
- Identify entity relationships from functional requirements
- Apply standard fields from constitution:
  - `id` (UUID PRIMARY KEY)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)
- Generate data-model.md with:
  - Entity name and description
  - Fields with types and constraints
  - Relationships (one-to-many, many-to-many)
  - Validation rules
  - RLS policies (per constitution requirement)

**Example Entity Template**:
```markdown
### Entity: [Name]

**Description**: [What this entity represents]

**Fields**:
- `id` (UUID, PRIMARY KEY) - Unique identifier
- `[field]` ([type]) - [description]
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Relationships**:
- [Relationship type] with [Other Entity]

**Validation**:
- [Rule]: [Description]

**RLS Policies**:
- [Policy]: [SQL rule]
```

---

## Research Item 5: API Contract Generation

### Decision: OpenAPI 3.0 from User Scenarios

**Rationale**:
- OpenAPI is industry standard for HTTP API documentation
- User scenarios describe API interactions (Given/When/Then)
- TypeScript type generation from OpenAPI ensures type safety
- Aligns with constitution's requirement for explicit contracts

**Alternatives Considered**:
1. **GraphQL schema**: Not currently in tech stack, adds complexity
2. **gRPC/Protocol Buffers**: Over-engineered for web/mobile app
3. **Informal API docs**: Not machine-readable, can't generate types

**Implementation Details**:
- Map user actions to HTTP endpoints:
  - "When they click Generate" → `POST /api/music/generate`
  - "When they view library" → `GET /api/music/tracks`
- Infer request/response schemas from acceptance criteria
- Use RESTful conventions:
  - GET for reads
  - POST for creates
  - PUT/PATCH for updates
  - DELETE for removals
- Generate OpenAPI YAML in `contracts/api.yaml`
- Include examples for each endpoint

**OpenAPI Structure**:
```yaml
openapi: 3.0.0
info:
  title: [Feature] API
  version: 1.0.0
paths:
  /api/[resource]:
    get:
      summary: [Action]
      parameters: [...]
      responses:
        200:
          description: Success
          content:
            application/json:
              schema: [...]
              examples: [...]
```

---

## Research Item 6: Task Generation Following INVEST Principles

### Decision: Hierarchical Task Breakdown with Dependency Tracking

**Rationale**:
- INVEST principles (Independent, Negotiable, Valuable, Estimable, Small, Testable) ensure high-quality tasks
- Constitution requires P1 user stories to have TDD approach
- Tasks should map 1:1 with PR/commits for easy code review
- Supports incremental delivery (constitution Principle 4)

**Alternatives Considered**:
1. **Flat task list**: Loses context, hard to prioritize
2. **Waterfall phases**: Violates incremental delivery principle
3. **Arbitrary task sizing**: Inconsistent estimates, poor planning

**Implementation Details**:
- Generate tasks per user story:
  - **Setup tasks**: Database schema, API setup, test infrastructure
  - **Core implementation**: Business logic, API endpoints
  - **Testing tasks**: Unit, integration, contract tests
  - **Polish tasks**: Error handling, logging, documentation
- Assign priorities matching user story priorities:
  - P1 user story → all related tasks are P1
  - P2 user story → all related tasks are P2
- Include constitution-mandated tasks:
  - Security review for auth/data handling
  - Performance tests for critical paths
  - Observability (logs/metrics) for all features
- Estimate in small units (1-2 days max per task)

**Task Template**:
```markdown
### Task [ID]: [Brief Title] (Priority: [P1/P2/P3])

**User Story**: [Link to original user story]

**Description**: [What needs to be done]

**Acceptance Criteria**:
- [ ] [Specific, testable outcome]
- [ ] Tests pass (unit + integration)
- [ ] Documentation updated

**Dependencies**: [Other task IDs if any]

**Estimate**: [0.5-2 days]

**Constitution Check**:
- [ ] Security: [Relevant security consideration or N/A]
- [ ] Testing: [Test coverage requirement]
- [ ] Observability: [Logs/metrics added]
```

---

## Research Item 7: Agent Context Update Strategy

### Decision: Append-Only with Manual Preservation Markers

**Rationale**:
- Manual additions by developers must be preserved (constitution compliance)
- New technologies from plans should be added to agent context for better AI suggestions
- Idempotent updates allow re-running without duplicates
- Simple text processing, no complex merge logic needed

**Alternatives Considered**:
1. **Complete regeneration**: Loses manual additions, violates maintainability
2. **Git merge**: Complex, error-prone for automated scripts
3. **Separate files**: Fragments context, harder for AI to use

**Implementation Details**:
- Agent context file: `.github/copilot-instructions.md` (for GitHub Copilot)
- Use markers: `<!-- AUTO-GENERATED: START -->` and `<!-- AUTO-GENERATED: END -->`
- Preserve content outside markers (manual additions)
- Extract new technologies from:
  - Primary Dependencies in Technical Context
  - npm packages added during implementation
  - New architecture patterns introduced
- De-duplicate before writing (check if already present)

**Update Algorithm**:
```
1. Read current agent context file
2. Extract manual sections (outside markers)
3. Parse plan.md for new technologies
4. Build new auto-generated section
5. Combine: manual + new auto-generated + manual
6. Write atomically (temp file + move)
```

**Example Marker Usage**:
```markdown
<!-- AUTO-GENERATED: START - DO NOT EDIT THIS SECTION MANUALLY -->
## Technologies

- React 19
- TypeScript 5
- Zustand 5.0 (added from feature-abc)
<!-- AUTO-GENERATED: END -->

## Manual Additions

[Developer's custom instructions here - preserved]
```

---

## Research Item 8: Constitution Compliance Validation

### Decision: Checklist-Based Pre-flight Validation

**Rationale**:
- Constitution defines 8 core principles (documented in constitution.md)
- Pre-flight validation catches violations before work begins
- Checklist format is human-readable and automatable
- Allows for justified exceptions (documented in Complexity Tracking)

**Alternatives Considered**:
1. **Post-implementation review**: Too late, rework is expensive
2. **Automated linting**: Not all principles are automatable (e.g., "simplicity")
3. **No validation**: Risks drift from constitution over time

**Implementation Details**:
- Generate Constitution Check section in plan.md
- Map principles to validation rules:
  - **Principle 1 (Testing)**: Check P1 stories have test requirements
  - **Principle 2 (Security)**: Flag auth/data handling for review
  - **Principle 3 (Observability)**: Require logs/metrics specification
  - **Principle 4 (Incremental)**: Ensure SemVer and migration plans
  - **Principle 5 (Simplicity)**: Flag complex architectures for justification
  - **Principle 6 (Performance)**: Check performance goals defined
  - **Principle 7 (i18n/a11y)**: Verify language/accessibility requirements
  - **Principle 8 (Telegram-first)**: Validate Mini App integration
- GATE enforcement: Block Phase 0 if critical violations found
- Re-check after Phase 1 design (implementation details may change)

**Validation Output**:
```markdown
## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Principle 1 (Testing): P1 user stories include test requirements
- [x] Principle 2 (Security): No auth/data handling OR security review planned
- [ ] Principle 3 (Observability): ⚠️ Missing logs/metrics specification
- [x] Principle 4 (Incremental): SemVer compatible, no breaking changes
- [x] Principle 5 (Simplicity): Architecture is straightforward
- [?] Principle 6 (Performance): NEEDS CLARIFICATION - no performance goals defined
- [x] Principle 7 (i18n/a11y): Uses existing i18n infrastructure
- [x] Principle 8 (Telegram-first): Integrates with Mini App SDK

**GATE STATUS**: ⚠️ WARNING - Address observability and performance before proceeding
```

---

## Research Item 9: Technology Stack Decisions (for Planning System itself)

### Decision: PowerShell + Markdown + JSON Schema

**Language**: PowerShell Core 7+ (cross-platform)  
**Rationale**: Already in use (setup-plan.ps1), no new dependencies, built-in JSON support

**Template Engine**: Simple String Substitution  
**Rationale**: Markdown templates are simple, don't need complex templating (Jinja, Handlebars)

**Schema Validation**: JSON Schema (optional runtime validation)  
**Rationale**: Industry standard, can validate generated artifacts, supports TypeScript type generation

**Storage**: Git repository (no database needed)  
**Rationale**: Version control for plans/tasks, familiar workflow, supports code review

**CI/CD Integration**: GitHub Actions  
**Rationale**: Already in use, free for public repos, easy PowerShell execution

---

## Research Item 10: Best Practices for Specification-to-Implementation

### Findings from Industry Research:

**1. Behavior-Driven Development (BDD)**:
- Given/When/Then format for acceptance criteria is industry standard
- Maps naturally to test cases (Cucumber, Jest)
- Ensures specifications are testable

**2. Domain-Driven Design (DDD)**:
- Entity extraction from ubiquitous language in specifications
- Bounded contexts help organize complex systems
- Aligns with constitution's simplicity principle

**3. INVEST Principles (Agile)**:
- Tasks should be Independent (no tight coupling)
- Negotiable (details can be adjusted)
- Valuable (delivers user value)
- Estimable (can be sized)
- Small (completed in days, not weeks)
- Testable (clear acceptance criteria)

**4. API-First Development**:
- Define contracts before implementation
- Enables parallel frontend/backend work
- Catches integration issues early

**5. Test-Driven Development (TDD)**:
- Write tests before code (constitution requirement for P1)
- Red-Green-Refactor cycle
- Improves design and reduces bugs

**References**:
- BDD: "Specification by Example" by Gojko Adzic
- DDD: "Domain-Driven Design" by Eric Evans
- INVEST: https://www.agilealliance.org/glossary/invest/
- API-First: https://swagger.io/resources/articles/adopting-an-api-first-approach/
- TDD: "Test Driven Development" by Kent Beck

---

## Summary of Resolved Unknowns

All NEEDS CLARIFICATION items from Technical Context have been resolved:

| Unknown | Resolution |
|---------|-----------|
| Language/Version | PowerShell Core 7+ |
| Primary Dependencies | Markdown parsing, JSON Schema, Git |
| Storage | Git repository (no additional storage) |
| Testing | Manual validation + optional JSON Schema validation |
| Target Platform | Cross-platform (Windows, macOS, Linux via PowerShell Core) |
| Project Type | Script-based CLI tool |
| Performance Goals | <5min for 50 user stories, <30min manual refinement |
| Constraints | No external API dependencies, work in CI/CD and local |
| Scale/Scope | 10-100 user stories per spec, unlimited specs |

---

## Next Steps (Phase 1)

With research complete, proceed to Phase 1:

1. **Generate data-model.md**: Define FeatureSpec, ImplementationPlan, Task, etc.
2. **Generate contracts/**: OpenAPI schemas for any APIs (likely N/A for file-based system)
3. **Generate quickstart.md**: Developer guide for using the planning system
4. **Update agent context**: Add new learnings to `.github/copilot-instructions.md`
5. **Re-evaluate Constitution Check**: Ensure design meets all principles

---

**Research Phase Status**: ✅ COMPLETE  
**Gate to Phase 1**: 🟢 APPROVED
