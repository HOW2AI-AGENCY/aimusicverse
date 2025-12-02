# Quickstart Guide: Task Planning System

**Feature**: Task Planning and Management System  
**Phase**: Phase 1 - Design  
**Date**: 2025-12-02  
**Audience**: Developers

## Overview

The Task Planning System is an automated workflow for translating feature specifications into actionable implementation plans and tasks. It follows the project's constitution principles and ensures consistency across all features.

**What it does**:
- Parses feature specifications (spec.md)
- Generates structured implementation plans (plan.md)
- Creates research documents to resolve unknowns (research.md)
- Defines data models and API contracts
- Generates granular, prioritized tasks (tasks.md)
- Validates against constitution principles

**Why it matters**:
- Saves time (automates manual planning work)
- Ensures consistency (all features follow same structure)
- Enforces quality (constitution compliance built-in)
- Improves estimation (standard task breakdown)
- Facilitates collaboration (clear documentation for team)

---

## Prerequisites

**Required Knowledge**:
- Basic understanding of the project's constitution (.specify/memory/constitution.md)
- Familiarity with Markdown and YAML frontmatter
- Git workflow (branches, commits, PRs)
- Command line / PowerShell basics

**Required Tools**:
- PowerShell Core 7+ (cross-platform)
- Git 2.30+
- Text editor with Markdown support (VS Code recommended)
- Node.js 18+ (for optional JSON Schema validation)

**Repository Setup**:
```bash
# Clone repository
git clone https://github.com/HOW2AI-AGENCY/aimusicverse.git
cd aimusicverse

# Install dependencies
npm install

# Verify PowerShell available
pwsh --version  # Should be 7.x or higher
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Input                                │
│              (Feature description)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Step 1: Create Branch & Spec                      │
│  .specify/scripts/powershell/setup-plan.ps1 -Json           │
│  → Creates: specs/[feature]/spec.md (from template)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Phase 0: Research & Resolution                       │
│  → Developer fills Technical Context                         │
│  → AI/Developer resolves NEEDS CLARIFICATION                 │
│  → Creates: specs/[feature]/research.md                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Phase 1: Design & Contracts                        │
│  → Extracts entities from spec                               │
│  → Generates API contracts                                   │
│  → Creates: data-model.md, contracts/, quickstart.md         │
│  → Updates agent context (.github/copilot-instructions.md)   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Phase 2: Task Generation                            │
│  → Breaks down user stories into tasks                       │
│  → Applies INVEST principles                                 │
│  → Creates: specs/[feature]/tasks.md                         │
│  → Ready for implementation                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Step 1: Initialize Feature Specification

**Goal**: Create a new feature spec from the user's description.

**Command**:
```powershell
# From repository root
.specify/scripts/powershell/setup-plan.ps1 -Json
```

**What happens**:
1. Script prompts for feature description (or uses $ARGUMENTS)
2. Generates a unique feature branch name
3. Creates `specs/[feature]/` directory
4. Copies `spec-template.md` to `specs/[feature]/spec.md`
5. Copies `plan-template.md` to `specs/[feature]/plan.md`
6. Outputs JSON with paths:
   ```json
   {
     "FEATURE_SPEC": "/path/to/spec.md",
     "IMPL_PLAN": "/path/to/plan.md",
     "SPECS_DIR": "/path/to/specs/[feature]",
     "BRANCH": "copilot/feature-name"
   }
   ```

**Manual Edit Required**:
1. Open `specs/[feature]/spec.md`
2. Fill in user stories with priorities (P1, P2, P3)
3. Define acceptance scenarios (Given/When/Then)
4. List functional requirements (FR-001, FR-002, ...)
5. Define success criteria (SC-001, SC-002, ...)

**Example**:
```markdown
### User Story 1 - Music Generation (Priority: P1)
As a user, I want to generate music from a text prompt, so that I can create songs without musical expertise.

**Acceptance Scenarios**:
1. **Given** a logged-in user, **When** they enter "upbeat jazz" and click Generate, **Then** a track is created within 30 seconds.
```

**Constitution Check**:
- [ ] At least one P1 user story exists
- [ ] Each user story has acceptance scenarios
- [ ] Functional requirements are specific and testable

---

### Step 2: Fill Technical Context and Validate

**Goal**: Define the technical approach and validate against constitution.

**Actions**:
1. Open `specs/[feature]/plan.md`
2. Fill in the Technical Context section:
   - Language/Version (e.g., TypeScript 5.9)
   - Primary Dependencies (e.g., React 19, Supabase)
   - Storage (e.g., PostgreSQL, File system, N/A)
   - Testing (e.g., Jest + React Testing Library)
   - Target Platform (e.g., Web, iOS, Linux)
   - Project Type (single, web, mobile)
   - Performance Goals (e.g., <2s load time)
   - Constraints (e.g., offline support required)
   - Scale/Scope (e.g., 10k users)

3. Mark unknowns with `NEEDS CLARIFICATION`:
   ```markdown
   **Language/Version**: TypeScript 5.9
   **Primary Dependencies**: NEEDS CLARIFICATION - unsure if we need Redux or Zustand
   **Storage**: PostgreSQL via Supabase
   ```

4. Fill in Constitution Check section:
   ```markdown
   ## Constitution Check
   
   - [x] Principle 1 (Testing): P1 user stories include test requirements
   - [x] Principle 2 (Security): Auth handled via Telegram OAuth + Supabase RLS
   - [ ] Principle 3 (Observability): ⚠️ NEEDS CLARIFICATION - what metrics to track?
   - [x] Principle 4 (Incremental): No breaking changes, backward compatible
   - [x] Principle 5 (Simplicity): Straightforward CRUD operations
   - [x] Principle 6 (Performance): <2s TTI target defined
   - [x] Principle 7 (i18n/a11y): Uses existing i18n infrastructure
   - [x] Principle 8 (Telegram-first): Integrates with Mini App SDK
   
   **GATE STATUS**: ⚠️ WARNING - Resolve observability before Phase 0
   ```

**Validation**:
```bash
# Optional: Validate plan structure
node -e "const fs = require('fs'); const plan = fs.readFileSync('specs/[feature]/plan.md', 'utf8'); console.log(plan.includes('NEEDS CLARIFICATION') ? 'Has unknowns - Phase 0 needed' : 'No unknowns - can skip Phase 0');"
```

**Gate Decision**:
- 🔴 BLOCKED: Critical constitution violations (security, P1 testing missing)
- ⚠️ WARNING: Non-critical issues, can proceed with caution
- 🟢 APPROVED: All checks pass, proceed to Phase 0

---

### Step 3: Phase 0 - Research Unknowns

**Goal**: Resolve all NEEDS CLARIFICATION items through research.

**Process**:
1. Extract unknowns from Technical Context
2. For each unknown, research:
   - What are the options? (alternatives)
   - What are the trade-offs?
   - What does the constitution recommend?
   - What do similar projects use?
3. Document decisions in `specs/[feature]/research.md`

**Template**:
```markdown
# Research Document: [Feature Name]

## Research Item 1: [Unknown Topic]

### Decision: [What was chosen]

**Rationale**: [Why this choice is best]

**Alternatives Considered**:
1. **Option A**: [Why rejected]
2. **Option B**: [Why rejected]

**Implementation Details**: [How to implement]

**References**:
- [Link to docs]
- [Similar project example]
```

**Example - State Management Choice**:
```markdown
## Research Item 2: State Management Library

### Decision: Zustand 5.0

**Rationale**:
- Already in tech stack (constitution prefers existing libraries)
- Simpler API than Redux (KISS principle)
- <1KB bundle size (performance principle)
- Works well with React 19

**Alternatives Considered**:
1. **Redux Toolkit**: Too complex for this use case, larger bundle
2. **Context API only**: Insufficient for complex state, performance issues
3. **Jotai**: Not in existing stack, team unfamiliar

**Implementation Details**:
- Create store in `src/stores/featureStore.ts`
- Use TypeScript types for state
- Follow existing patterns in `src/stores/userStore.ts`

**References**:
- Zustand docs: https://zustand-demo.pmnd.rs/
- Existing usage: src/stores/userStore.ts
```

**Completion Criteria**:
- [ ] All NEEDS CLARIFICATION items resolved
- [ ] Each decision has rationale and alternatives
- [ ] References provided for non-obvious choices
- [ ] Implementation details clear enough for Phase 1

---

### Step 4: Phase 1 - Generate Design Artifacts

**Goal**: Create data model, API contracts, and quickstart guide.

**Sub-step 4a: Create Data Model**

1. Extract entities from user stories and functional requirements
2. For each entity, define:
   - Name and description
   - Fields (with types, constraints)
   - Relationships (foreign keys, join tables)
   - Validation rules
   - RLS policies (for Supabase tables)

**Template** (in `specs/[feature]/data-model.md`):
```markdown
### Entity: MusicTrack

**Description**: Represents a generated music track

**Storage**: Supabase table `music_tracks`

**Fields**:
- `id` (UUID, PRIMARY KEY) - Unique identifier
- `user_id` (UUID, FOREIGN KEY → users.id) - Track owner
- `title` (VARCHAR(200), NOT NULL) - Track title
- `prompt` (TEXT) - Generation prompt
- `audio_url` (TEXT) - S3/Supabase Storage URL
- `duration` (INTEGER) - Duration in seconds
- `status` (ENUM: generating, complete, failed)
- `created_at` (TIMESTAMPTZ, NOT NULL) - Creation timestamp
- `updated_at` (TIMESTAMPTZ, NOT NULL) - Last update

**Relationships**:
- Belongs to User (user_id → users.id)
- Has many Tags (music_tracks_tags join table)

**Validation**:
- Title: 1-200 characters, no special chars in prefix
- Duration: positive integer, max 600 seconds
- Status: must be valid enum value

**RLS Policies**:
```sql
-- Users can read their own tracks
CREATE POLICY select_own_tracks ON music_tracks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tracks
CREATE POLICY insert_own_tracks ON music_tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```
```

**Sub-step 4b: Create API Contracts**

1. Map user actions to HTTP endpoints
2. Define request/response schemas
3. Provide examples
4. Document error responses

**Template** (in `specs/[feature]/contracts/api.yaml`):
```yaml
openapi: 3.0.0
info:
  title: Music Generation API
  version: 1.0.0

paths:
  /api/music/generate:
    post:
      summary: Generate a new music track
      operationId: generateMusic
      tags: [music]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [prompt]
              properties:
                prompt:
                  type: string
                  minLength: 10
                  maxLength: 5000
                instrumental:
                  type: boolean
                  default: false
            examples:
              jazz:
                value:
                  prompt: "upbeat jazz with piano and saxophone"
                  instrumental: false
      responses:
        201:
          description: Track generation started
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  taskId:
                    type: string
                    format: uuid
        400:
          description: Invalid request
        401:
          description: Unauthorized
        500:
          description: Server error
```

**Sub-step 4c: Create Quickstart Guide**

Copy this document structure! The quickstart should help the next developer implement the feature.

**Validation**:
```bash
# Validate OpenAPI schema
npx @apidevtools/swagger-cli validate specs/[feature]/contracts/api.yaml

# Validate JSON Schemas (if created)
npm run validate-schemas  # Custom script if needed
```

---

### Step 5: Update Agent Context

**Goal**: Add new technologies and patterns to AI agent context for better suggestions.

**Script** (to be created):
```powershell
.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot
```

**Manual Process** (until script exists):
1. Open `.github/copilot-instructions.md`
2. Find `<!-- AUTO-GENERATED: START -->` marker
3. Add new technologies from plan.md:
   ```markdown
   <!-- AUTO-GENERATED: START - DO NOT EDIT THIS SECTION MANUALLY -->
   ## Technologies (Updated from feature-xyz)
   
   - React 19
   - TypeScript 5.9
   - Zustand 5.0 (for state management - added from create-task-plan)
   - JSON Schema (for validation - added from create-task-plan)
   <!-- AUTO-GENERATED: END -->
   ```
4. Preserve any manual additions outside the markers
5. De-duplicate entries (don't add if already present)

**Verification**:
```bash
# Check that markers are balanced
grep -n "AUTO-GENERATED" .github/copilot-instructions.md
# Should show START and END on different lines
```

---

### Step 6: Phase 2 - Generate Tasks

**Goal**: Break down the implementation plan into granular, prioritized tasks.

**Process**:
1. For each user story, create tasks:
   - Setup tasks (database, API scaffolding, tests)
   - Core implementation (business logic, endpoints)
   - Testing tasks (unit, integration, contract)
   - Polish tasks (error handling, logging, docs)

2. Apply INVEST principles:
   - **Independent**: No tight coupling between tasks
   - **Negotiable**: Implementation details flexible
   - **Valuable**: Each task delivers user value
   - **Estimable**: Can be sized (0.5-2 days)
   - **Small**: Completed in 1-2 days max
   - **Testable**: Clear acceptance criteria

3. Assign priorities:
   - P1 user story → all related tasks are P1
   - Include constitution-mandated tasks (security, observability)

**Template** (in `specs/[feature]/tasks.md`):
```markdown
---
feature: "Music Generation"
phase: "Phase 2 - Implementation"
date: "2025-12-02"
total_tasks: 12
p1_tasks: 8
p2_tasks: 3
p3_tasks: 1
---

# Task List: Music Generation

## P1 Tasks

### Task T-001: Create Database Schema (Priority: P1)

**User Story**: User Story 1 - Music Generation

**Description**: Create `music_tracks` table in Supabase with all required fields, indexes, and RLS policies.

**Acceptance Criteria**:
- [ ] Migration script created in `supabase/migrations/`
- [ ] Table includes all fields from data-model.md
- [ ] Indexes on `user_id`, `status`, `created_at`
- [ ] RLS policies applied and tested
- [ ] Migration tested on local Supabase instance

**Dependencies**: None

**Estimate**: 1 day

**Constitution Check**:
- **Security**: RLS policies enforce user can only access own tracks
- **Testing**: Unit tests for RLS policies (see supabase/tests/)
- **Observability**: N/A (database schema)

**Implementation Notes**:
- Follow existing migration patterns in supabase/migrations/
- Use UUID for primary key
- Add triggers for `updated_at` auto-update
```

**Validation**:
- [ ] All P1 user stories have corresponding P1 tasks
- [ ] Each task has 2+ acceptance criteria
- [ ] Estimates are 0.5-2 days (no larger tasks)
- [ ] Dependencies are valid task IDs
- [ ] Testing strategy defined for each task

---

## Common Pitfalls

### Pitfall 1: Incomplete Specifications
**Problem**: Spec.md missing key details (no acceptance criteria, vague requirements)  
**Solution**: Use the spec-template.md as checklist, ensure all sections filled  
**Prevention**: Review spec with team before starting Phase 0

### Pitfall 2: Skipping Research Phase
**Problem**: Jumping to implementation without resolving unknowns  
**Solution**: Never skip Phase 0 if Technical Context has "NEEDS CLARIFICATION"  
**Prevention**: Constitution Check gate enforces this

### Pitfall 3: Over-Engineering
**Problem**: Adding unnecessary complexity (microservices, complex patterns)  
**Solution**: Follow constitution's Simplicity principle, justify violations  
**Prevention**: Complexity Tracking section forces justification

### Pitfall 4: Ignoring Constitution Principles
**Problem**: Plans that violate testing, security, or observability requirements  
**Solution**: Use Constitution Check as gate, address violations before Phase 0  
**Prevention**: Automated checks in CI/CD (future enhancement)

### Pitfall 5: Tasks Too Large
**Problem**: Tasks estimated >2 days, blocking incremental delivery  
**Solution**: Break down into smaller sub-tasks following INVEST principles  
**Prevention**: Review task estimates with team, enforce max 2 days

### Pitfall 6: Missing API Contracts
**Problem**: Frontend and backend implemented with mismatched assumptions  
**Solution**: Always create contracts/ before implementation, validate schemas  
**Prevention**: Contract-first development, automated schema validation

### Pitfall 7: Agent Context Not Updated
**Problem**: AI gives outdated or irrelevant suggestions  
**Solution**: Run update-agent-context.ps1 after Phase 1 completes  
**Prevention**: Make it part of Phase 1 checklist

---

## Testing Guide

### How to Verify Implementation

**1. Validate Specification**:
```bash
# Check spec.md has all required sections
node -e "const fs = require('fs'); const spec = fs.readFileSync('specs/[feature]/spec.md', 'utf8'); const required = ['User Scenarios', 'Requirements', 'Success Criteria']; required.forEach(s => { if (!spec.includes(s)) console.error('Missing: ' + s); });"
```

**2. Validate Plan Structure**:
```bash
# Check plan.md has Technical Context filled
grep "NEEDS CLARIFICATION" specs/[feature]/plan.md
# Should return nothing if ready for Phase 1
```

**3. Validate Research Completeness**:
```bash
# Check research.md has decisions for all items
grep "### Decision:" specs/[feature]/research.md | wc -l
# Should match number of research items
```

**4. Validate API Contracts**:
```bash
# Validate OpenAPI schema
npx @apidevtools/swagger-cli validate specs/[feature]/contracts/api.yaml
```

**5. Validate Task Breakdown**:
```bash
# Check tasks have proper IDs and estimates
grep "^### Task T-" specs/[feature]/tasks.md | wc -l
# Count should match total_tasks in frontmatter
```

**6. Validate Constitution Compliance**:
```bash
# Check that P1 tasks include testing
grep -A 10 "Priority: P1" specs/[feature]/tasks.md | grep -i "test"
# Should find testing requirements for P1 tasks
```

---

## References

**Related Documentation**:
- [Constitution](.specify/memory/constitution.md) - Project principles
- [Spec Template](.specify/templates/spec-template.md) - Feature spec template
- [Plan Template](.specify/templates/plan-template.md) - Implementation plan template
- [Tasks Template](.specify/templates/tasks-template.md) - Task list template

**External Resources**:
- [INVEST Principles](https://www.agilealliance.org/glossary/invest/) - Agile Alliance
- [OpenAPI Specification](https://swagger.io/specification/) - Swagger
- [JSON Schema](https://json-schema.org/) - Validation standard
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit format

**Tools**:
- [swagger-cli](https://github.com/APIDevTools/swagger-cli) - OpenAPI validation
- [openapi-typescript](https://github.com/drwpow/openapi-typescript) - Type generation
- [ajv](https://ajv.js.org/) - JSON Schema validation

---

## Next Steps

After completing the quickstart guide and Phase 1:

1. **Review with team**: Get feedback on data model and contracts
2. **Update plan.md**: Mark Phase 1 as complete, update phase to "Phase2"
3. **Run Phase 2**: Generate tasks.md using patterns from this guide
4. **Create GitHub Issues**: Import tasks to project board
5. **Begin implementation**: Start with P1 tasks, follow TDD for P1 user stories

---

**Quickstart Status**: ✅ COMPLETE  
**Ready for Implementation**: After Phase 2 tasks are generated
