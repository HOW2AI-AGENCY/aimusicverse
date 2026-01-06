# Implementation Plan: UI/UX Audit and Optimization Project

**Branch**: `001-ui-ux-audit` | **Date**: 2026-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ui-ux-audit/spec.md`

**Note**: This plan defines a comprehensive 4-week audit project across 7 user stories (P1-P3) to evaluate and improve UI/UX consistency, accessibility, performance, and user experience across 967 React components spanning 46 pages.

## Summary

This implementation plan establishes a systematic approach to conducting a comprehensive UI/UX audit of MusicVerse AI, covering component architecture analysis, design system compliance, accessibility assessment, mobile-first implementation review, performance bottleneck analysis, interaction pattern consistency, and documentation creation. The audit will produce actionable insights with prioritized remediation roadmap, pattern library, and consolidation playbook to enable efficient optimization execution.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 19.0.0  
**Primary Dependencies**: 
- Vite 5.4.11 (build tooling)
- TanStack Query 5.66.1 (server state)
- Zustand 5.0.2 (global UI state)
- Tailwind CSS 3.4.17 (styling)
- shadcn/ui + Radix UI (component primitives)
- Framer Motion 11.15.0 (animations)
- Telegram Mini App SDK 8.0 (@twa-dev/sdk)
- react-virtuoso 4.12.2 (list virtualization)

**Storage**: PostgreSQL (Supabase) with Row Level Security (RLS), localStorage for drafts/preferences

**Testing**: 
- Jest 30.2.0 + @testing-library/react (unit tests)
- Playwright 1.57.0 (E2E tests)
- axe-core (accessibility scanning)
- Lighthouse CI (performance audits)
- Bundle size: size-limit tool (950KB hard limit)

**Target Platform**: Telegram Mini App (iOS Safari 15+, Chrome Android 100+), portrait-first mobile web (375px-430px primary)

**Project Type**: Mobile-first web application (Telegram Mini App architecture)

**Performance Goals**: 
- Lighthouse score >85 all pages
- Bundle size <950KB (gzipped)
- FCP <1.5s, LCP <2.5s, TTI <3.5s
- 60fps animations on mid-range devices
- <10 re-renders per user interaction

**Constraints**: 
- Must respect Telegram webview constraints (iOS audio limits, safe areas)
- Mobile-first design (portrait 375×667px to 430×932px primary)
- Touch targets ≥44-56px minimum
- WCAG 2.1 AA compliance mandatory
- No new tools/libraries unless justified
- Audit-only phase (no code changes, documentation/analysis only)

**Scale/Scope**: 
- 967 React components across 109 directories
- 148,026 lines of component code
- 46 pages/routes
- 30+ feature domains
- 1,190 lines design system specification
- 4-week audit timeline with weekly checkpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ PASS: Audit Project Alignment

**I. Mobile-First Development for Telegram Mini App**
- ✅ COMPLIANT: Audit will validate portrait-first design (375×667px to 430×932px)
- ✅ COMPLIANT: Will verify touch target sizing (44-56px minimum) across all components
- ✅ COMPLIANT: Will assess Telegram SDK integration (haptics, MainButton, BackButton)
- ✅ COMPLIANT: Will evaluate safe area handling and keyboard behavior

**II. Performance & Bundle Optimization**
- ✅ COMPLIANT: Audit will analyze bundle size against 950KB hard limit
- ✅ COMPLIANT: Will identify missing lazy loading opportunities (React.lazy)
- ✅ COMPLIANT: Will evaluate virtualization usage for lists >50 items
- ✅ COMPLIANT: Will review Framer Motion usage via @/lib/motion wrapper

**III. Audio Architecture**
- ⚪ NOT APPLICABLE: Audit focuses on UI/UX, audio architecture not in scope

**IV. Component Architecture**
- ✅ COMPLIANT: Will analyze component organization and identify duplication
- ✅ COMPLIANT: Will verify shadcn/ui pattern compliance
- ✅ COMPLIANT: Will audit import path consistency (@/ alias usage)
- ✅ COMPLIANT: Will check TypeScript strict mode adherence

**V. State Management Strategy**
- ⚪ NOT APPLICABLE: Audit analyzes UI patterns, not state management implementation

**VI. Security & Privacy**
- ⚪ NOT APPLICABLE: No data handling changes in audit phase

**VII. Accessibility & UX Standards**
- ✅ COMPLIANT: WCAG 2.1 AA assessment is primary audit objective (User Story 3)
- ✅ COMPLIANT: Will verify touch accessibility (targets, spacing, states, haptics)
- ✅ COMPLIANT: Will test keyboard navigation and screen reader support
- ✅ COMPLIANT: Will measure color contrast ratios
- ✅ COMPLIANT: Will evaluate loading/error state consistency

**VIII. Unified Component Architecture**
- ✅ COMPLIANT: Will audit MainLayout, BottomNavigation, MobileHeaderBar usage
- ✅ COMPLIANT: Will verify MobileBottomSheet vs Dialog pattern compliance
- ✅ COMPLIANT: Will analyze VirtualizedTrackList adoption
- ✅ COMPLIANT: Will check LazyImage component usage
- ✅ COMPLIANT: Will evaluate UnifiedStudioMobile architecture

**IX. Screen Development Patterns**
- ✅ COMPLIANT: Will verify lazy loading pattern adoption
- ✅ COMPLIANT: Will analyze TanStack Query usage patterns
- ✅ COMPLIANT: Will check Framer Motion optimization (@/lib/motion)
- ✅ COMPLIANT: Will evaluate form handling patterns

**X. Performance Budget Enforcement**
- ✅ COMPLIANT: Bundle size analysis is core audit activity (User Story 5)
- ✅ COMPLIANT: Will verify route-level code splitting
- ✅ COMPLIANT: Will check image optimization (LazyImage, WebP)
- ✅ COMPLIANT: Will validate animation performance (60fps target)

### 📋 Audit-Specific Considerations

**No Constitution Violations**: This is an audit/analysis project that evaluates compliance with existing constitution principles. No new patterns or architectural changes are introduced during the audit phase.

**Post-Audit Execution**: Any optimization work derived from audit findings will be subject to separate constitution checks in their respective implementation plans.

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-ux-audit/
├── plan.md                           # This file (implementation plan)
├── spec.md                           # Feature specification (7 user stories)
├── research.md                       # Phase 0: Audit tools, methodologies, best practices
├── data-model.md                     # Phase 1: Audit data entities (violations, patterns, bottlenecks)
├── quickstart.md                     # Phase 1: How to run audit scripts and interpret results
├── contracts/                        # Phase 1: Audit report schemas and templates
│   ├── component-inventory-schema.json
│   ├── duplication-pattern-schema.json
│   ├── design-violation-schema.json
│   ├── accessibility-violation-schema.json
│   ├── performance-bottleneck-schema.json
│   ├── interaction-pattern-schema.json
│   └── audit-report-template.md
└── tasks.md                          # Phase 2: Execution tasks (NOT created by this command)
```

### Audit Artifacts (generated during execution)

```text
specs/001-ui-ux-audit/artifacts/
├── component-inventory.json          # Complete component catalog (967 components)
├── duplication-analysis.json         # Identified duplication patterns
├── design-compliance-report.json     # Design system violations
├── accessibility-violations.json     # WCAG 2.1 AA issues
├── performance-profile.json          # Performance bottlenecks
├── interaction-patterns.json         # UX pattern inconsistencies
├── remediation-roadmap.json          # Prioritized fix list
├── pattern-library/                  # Reusable patterns documentation
│   ├── unified-card-pattern.md
│   ├── bottom-sheet-pattern.md
│   ├── lazy-loading-pattern.md
│   └── ...
└── consolidation-playbook/           # Step-by-step consolidation guides
    ├── card-consolidation-guide.md
    ├── modal-standardization.md
    └── ...
```

### Source Code (repository root - analysis targets)

```text
src/
├── components/                       # 967 components across 109 directories
│   ├── ui/                          # Base shadcn/ui components (44 components)
│   ├── mobile/                      # Mobile-specific components (13 components)
│   ├── layout/                      # Layout components (MainLayout, ErrorBoundary)
│   ├── player/                      # Audio player components (~20 components)
│   ├── library/                     # Library/track list components
│   ├── generate-form/               # Music generation form
│   ├── lyrics/                      # AI Lyrics Wizard
│   ├── stem-studio/                 # Stem separation studio
│   ├── playlist/                    # Playlist management
│   ├── studio/                      # Unified studio system
│   ├── track/                       # Track cards, actions, details
│   ├── home/                        # Homepage sections
│   ├── profile/                     # User profile
│   ├── settings/                    # Settings screens
│   └── [60+ other feature directories]
├── pages/                           # 46 pages/routes
├── hooks/                           # Custom React hooks
├── stores/                          # Zustand state stores
├── lib/                             # Utilities and helpers
└── styles/                          # Global styles, Tailwind config

tests/                               # Test files (audit coverage analysis)
docs/                                # Existing documentation
DESIGN_SYSTEM_SPECIFICATION.md       # 1,190 line design system
CLAUDE.md                            # Development guidelines
constitution.md                      # Architecture principles
```

### Audit Tools & Scripts

```text
scripts/
├── audit/                           # Audit automation scripts (to be created)
│   ├── component-analyzer.js        # Component inventory generator
│   ├── duplication-detector.js      # AST-based duplication finder
│   ├── design-compliance-checker.js # Design system violation scanner
│   ├── accessibility-scanner.js     # Automated a11y checks (axe-core)
│   ├── performance-profiler.js      # Bundle analysis + performance metrics
│   ├── pattern-extractor.js         # Interaction pattern analyzer
│   └── report-generator.js          # Consolidated report builder
└── existing/
    ├── accessibility-audit.js       # Existing a11y audit script
    ├── accessibility-audit-results.md
    └── performance-audit-results.md
```

**Structure Decision**: Single project audit approach with centralized artifact storage in `specs/001-ui-ux-audit/artifacts/`. All 967 components in `src/components/` are analysis targets. Audit scripts in `scripts/audit/` directory leverage existing tooling (Lighthouse, axe-core, bundle analyzer) and produce structured JSON outputs matching contract schemas. Pattern library and consolidation playbook serve as blueprints for future optimization work.

## Complexity Tracking

> **No violations requiring justification**

This audit project introduces NO new complexity or architectural patterns. It is a pure analysis and documentation effort that evaluates compliance with existing constitution principles and design system standards. All findings will inform future optimization work which will undergo separate constitution checks in their respective implementation plans.

---

## Phase 0: Audit Methodology Research & Tool Selection

**Objective**: Establish audit methodologies, select tools, define metrics, and resolve all technical unknowns before beginning analysis.

**Duration**: Week 1 (5 days)

**Deliverable**: `research.md` with decisions, rationale, and alternatives considered

### Research Areas

#### 1. Component Architecture Analysis Tools

**Research Question**: What tools/approaches best identify component duplication and consolidation opportunities in a 967-component React codebase?

**Investigation Areas**:
- AST-based analysis tools (jscodeshift, @babel/parser)
- Static code similarity detection (jsinspect, simian)
- Component dependency graph visualization (Madge, Dependency Cruiser)
- Manual pattern recognition vs automated detection tradeoffs
- Scalability to 148k lines of component code

**Success Criteria**: Tool recommendation with accuracy metrics and example duplication patterns detected

#### 2. Design System Compliance Scanning

**Research Question**: How to programmatically validate 967 components against 1,190-line design system specification covering colors, typography, spacing, and patterns?

**Investigation Areas**:
- CSS-in-JS analysis (stylelint custom rules, PostCSS plugins)
- Tailwind class extraction and validation
- shadcn/ui pattern compliance checking
- Hard-coded value detection (colors, spacing, font-sizes)
- Telegram theme integration validation
- Manual review sampling strategy for nuanced violations

**Success Criteria**: Automated + manual hybrid approach with false positive rate <10%

#### 3. Accessibility Testing Methodology (WCAG 2.1 AA)

**Research Question**: What combination of automated and manual testing ensures comprehensive WCAG 2.1 AA compliance assessment across 46 pages?

**Investigation Areas**:
- Automated scanning tools (axe-core, pa11y, Lighthouse, WAVE)
- Screen reader testing approach (NVDA, JAWS, VoiceOver)
- Keyboard navigation testing methodology
- Touch accessibility validation on mobile devices
- Color contrast measurement tools (Contrast Checker, ColorBox)
- ARIA usage patterns audit
- Comparison with existing `scripts/accessibility-audit-results.md`

**Success Criteria**: Testing matrix defining automated vs manual checks per WCAG criterion

#### 4. Mobile-First Implementation Testing

**Research Question**: How to systematically evaluate mobile-first quality across responsive components, touch optimization, and Telegram Mini App integration?

**Investigation Areas**:
- Device testing strategy (physical devices vs emulators)
- Breakpoint validation approach (320px, 375px, 414px, 768px)
- Touch target sizing measurement automation
- Haptic feedback verification methodology
- Safe area handling validation (notch, Dynamic Island)
- Portrait/landscape orientation testing
- Virtual keyboard behavior testing
- Telegram SDK integration validation (MainButton, BackButton, haptics)

**Success Criteria**: Mobile testing checklist with pass/fail criteria per component

#### 5. Performance Profiling Approach

**Research Question**: What profiling methodology identifies UI rendering bottlenecks, bundle size issues, and optimization opportunities most effectively?

**Investigation Areas**:
- React DevTools Profiler usage patterns
- Lighthouse CI automation and scoring thresholds
- Bundle analysis tools (webpack-bundle-analyzer, source-map-explorer)
- Core Web Vitals measurement (FCP, LCP, TTI, CLS)
- Re-render detection and flame graph analysis
- List virtualization gap detection
- Lazy loading coverage analysis
- Animation performance measurement (60fps validation)
- Comparison with existing bundle size monitoring (950KB limit)

**Success Criteria**: Profiling playbook with metrics collection, baseline establishment, bottleneck prioritization

#### 6. Interaction Pattern Analysis

**Research Question**: How to systematically document and compare interaction patterns across 46 pages to identify inconsistencies?

**Investigation Areas**:
- User flow mapping techniques
- Pattern extraction from component props/behavior
- State communication analysis (loading, success, error patterns)
- Navigation pattern documentation
- Confirmation dialog usage tracking
- Empty state pattern cataloguing
- Toast notification consistency checking
- Error boundary implementation review

**Success Criteria**: Pattern taxonomy with consistency scoring rubric

#### 7. Data Collection and Artifact Schemas

**Research Question**: What structured data formats enable efficient analysis, reporting, and remediation tracking?

**Investigation Areas**:
- JSON schema design for audit artifacts
- Relationship modeling between violations and components
- Severity/priority scoring systems
- Effort estimation frameworks (T-shirt sizes vs story points)
- Impact measurement approaches
- Report template design (executive summary, technical deep-dive)
- Integration with project management tools (GitHub Issues)

**Success Criteria**: Contract schemas in `contracts/` directory with validation examples

#### 8. Timeline and Resource Estimation

**Research Question**: What is realistic timeline for 7 user stories across 967 components with quality gates?

**Investigation Areas**:
- Prior audit case studies (React codebases of similar scale)
- Parallel vs sequential task execution
- Quality gate checkpoint frequency
- Stakeholder review cycles
- Team capacity assumptions
- Risk buffer allocation
- Dependency sequencing (which analyses inform others)

**Success Criteria**: 4-week timeline with weekly milestones and contingency plans

### Expected Research Outputs (research.md structure)

```markdown
# UI/UX Audit Research

## Tool Selection Decisions

### Component Analysis: [Chosen Tool]
- **Decision**: [What was selected]
- **Rationale**: [Why selected - performance, accuracy, integration]
- **Alternatives Considered**: [Other options and why rejected]
- **Configuration**: [How to use it for this project]

[Repeat for each research area]

## Audit Metrics Definitions

[Precise definitions of all metrics: duplication percentage, compliance score, violation severity, etc.]

## Risk Mitigation Strategies

[Identified risks and mitigation plans]

## Timeline Validation

[Justification for 4-week timeline with milestone breakdown]
```

### Phase 0 Exit Criteria

- ✅ All "NEEDS CLARIFICATION" items from Technical Context resolved
- ✅ Tool selections documented with rationale
- ✅ Audit methodology defined for all 7 user stories
- ✅ Data schemas designed and validated
- ✅ Timeline confirmed as feasible
- ✅ Stakeholder review of research.md completed

---

## Phase 1: Audit Design & Contract Definition

**Objective**: Design audit data model, define report contracts, create execution quickstart, and update agent context.

**Duration**: Week 1 (2 days, overlaps with Phase 0)

**Deliverables**: 
- `data-model.md` - Audit entity definitions
- `contracts/*.json` - Report schemas
- `quickstart.md` - Audit execution guide
- Updated `.claude/agents/copilot.md` (via update-agent-context script)

### 1. Data Model Design (data-model.md)

Define all audit entity schemas with validation rules extracted from functional requirements.

#### Core Entities

**Component Inventory Record**
```typescript
interface ComponentInventoryRecord {
  id: string;                          // Unique identifier
  name: string;                        // Component name (e.g., "UnifiedTrackCard")
  filePath: string;                    // Absolute path from repo root
  componentType: 'presentational' | 'container' | 'page' | 'utility' | 'layout';
  linesOfCode: number;                 // Excluding comments/whitespace
  dependencies: string[];              // Imported components
  duplicationStatus: 'unique' | 'exact-duplicate' | 'near-duplicate' | 'shared-logic-candidate';
  designSystemCompliance: {
    score: number;                     // 0-100
    colorViolations: number;
    typographyViolations: number;
    spacingViolations: number;
    patternViolations: number;
  };
  accessibilityStatus: 'compliant' | 'minor-issues' | 'major-issues' | 'critical-issues';
  hasAccessibilityTests: boolean;
  usesLazyLoading: boolean;
  usesVirtualization: boolean;
  notes: string;
  lastAudited: string;                 // ISO 8601 timestamp
}
```

**Duplication Pattern**
```typescript
interface DuplicationPattern {
  id: string;
  patternType: 'exact-duplicate' | 'near-duplicate' | 'shared-logic';
  affectedComponents: string[];        // File paths
  similarity: number;                  // 0-100 percentage
  consolidationOpportunity: string;    // Description
  estimatedEffort: 'XS' | 'S' | 'M' | 'L' | 'XL';  // T-shirt sizing
  estimatedImpact: {
    linesReduced: number;
    componentsAffected: number;
    maintenanceImprovement: 'low' | 'medium' | 'high';
  };
  priorityRanking: number;             // 1-N, 1 = highest
  proposedSolution: string;            // Consolidation approach
  references: string[];                // Similar patterns (e.g., UnifiedTrackCard)
  detectedBy: 'automated' | 'manual';
}
```

**Design System Violation**
```typescript
interface DesignSystemViolation {
  id: string;
  violationType: 'color' | 'typography' | 'spacing' | 'pattern' | 'theming';
  severity: 'critical' | 'major' | 'minor';
  affectedComponent: string;           // File path
  location: {
    line: number;
    column: number;
  };
  currentImplementation: string;       // Code snippet or description
  correctImplementation: string;       // How it should be
  remediationGuidance: string;         // Step-by-step fix
  designSystemReference: string;       // Section in DESIGN_SYSTEM_SPECIFICATION.md
  estimatedEffort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  blocksRelease: boolean;              // True for critical violations
}
```

**Accessibility Violation**
```typescript
interface AccessibilityViolation {
  id: string;
  wcagCriterion: string;               // e.g., "1.4.3", "2.1.1"
  wcagLevel: 'A' | 'AA' | 'AAA';
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  affectedPage: string;                // Page route or component path
  violationDescription: string;
  userImpact: string;                  // Who is affected and how
  detectedBy: 'axe-core' | 'lighthouse' | 'manual' | 'screen-reader';
  remediationSteps: string[];          // Ordered list of fixes
  estimatedEffort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  testingNotes: string;                // How to verify fix
  wcagReference: string;               // Link to WCAG documentation
}
```

**Performance Bottleneck**
```typescript
interface PerformanceBottleneck {
  id: string;
  bottleneckType: 'unnecessary-rerenders' | 'bundle-size' | 'lazy-loading-missing' | 
                  'animation-jank' | 'image-optimization' | 'virtualization-missing';
  affectedPage: string;                // Page route
  affectedComponent?: string;          // Specific component if applicable
  currentMetrics: {
    renderTime?: number;               // ms
    bundleSize?: number;               // KB
    frameRate?: number;                // fps
    lighthouse?: {
      performance: number;
      fcp: number;
      lcp: number;
      tti: number;
      cls: number;
    };
  };
  targetMetrics: {
    [key: string]: number;             // Same keys as currentMetrics
  };
  optimizationApproach: string;        // Detailed strategy
  estimatedImpact: {
    performanceGain: string;           // e.g., "30% faster LCP"
    bundleSizeReduction?: number;      // KB
    userExperienceImprovement: string;
  };
  estimatedEffort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  detectedBy: 'lighthouse' | 'devtools-profiler' | 'bundle-analyzer' | 'manual';
}
```

**Interaction Pattern**
```typescript
interface InteractionPattern {
  id: string;
  patternType: 'navigation' | 'form-submission' | 'confirmation' | 'error-handling' | 
               'loading-state' | 'empty-state' | 'notification';
  currentImplementations: Array<{
    component: string;                 // File path
    description: string;
    codeSnippet?: string;
  }>;
  consistencyAssessment: {
    isConsistent: boolean;
    variationCount: number;
    inconsistencyDescription: string;
  };
  recommendedStandardPattern: {
    description: string;
    rationale: string;
    codeExample: string;
    affectedComponents: string[];      // Components needing updates
  };
  impactOfStandardization: string;
  estimatedEffort: 'XS' | 'S' | 'M' | 'L' | 'XL';
}
```

**Audit Report**
```typescript
interface AuditReport {
  metadata: {
    reportDate: string;                // ISO 8601
    auditors: string[];
    auditVersion: string;              // e.g., "1.0.0"
    scope: string;                     // Description of what was audited
  };
  executiveSummary: {
    overallHealthScore: number;        // 0-100
    criticalIssuesCount: number;
    majorIssuesCount: number;
    minorIssuesCount: number;
    keyRecommendations: string[];
  };
  findingsByCategory: {
    componentArchitecture: {
      totalComponents: number;
      duplicationPatterns: number;
      consolidationOpportunities: number;
    };
    designSystemCompliance: {
      averageComplianceScore: number;
      totalViolations: number;
      violationsByType: Record<string, number>;
    };
    accessibility: {
      compliancePercentage: number;
      wcagAViolations: number;
      wcagAAViolations: number;
      pagesFullyCompliant: number;
    };
    performance: {
      averageLighthouseScore: number;
      pagesUnder90: number;
      bundleSizeStatus: 'under-budget' | 'near-limit' | 'over-budget';
      criticalBottlenecks: number;
    };
    mobileFirst: {
      touchTargetCompliance: number;   // Percentage
      safeAreaCompliance: number;
      hapticFeedbackCoverage: number;
    };
    interactionPatterns: {
      patternsDocumented: number;
      inconsistenciesFound: number;
      standardizationNeeded: number;
    };
  };
  prioritizedRecommendations: Array<{
    rank: number;
    category: string;
    recommendation: string;
    impactScore: number;               // 1-10
    effortScore: number;               // 1-10
    affectedComponents: number;
  }>;
  remediationRoadmap: {
    phase1: { description: string; issues: string[]; estimatedWeeks: number; };
    phase2: { description: string; issues: string[]; estimatedWeeks: number; };
    phase3: { description: string; issues: string[]; estimatedWeeks: number; };
  };
  appendices: {
    componentInventory: string;        // Path to full inventory
    patternLibrary: string;            // Path to pattern library
    consolidationPlaybook: string;     // Path to playbook
  };
}
```

### 2. API Contracts (contracts/ directory)

Create JSON schemas for each entity:

- `component-inventory-schema.json`
- `duplication-pattern-schema.json`
- `design-violation-schema.json`
- `accessibility-violation-schema.json`
- `performance-bottleneck-schema.json`
- `interaction-pattern-schema.json`
- `audit-report-schema.json`

Each schema includes:
- Full type definitions
- Validation rules (required fields, value ranges)
- Examples
- Relationships to other entities

### 3. Quickstart Guide (quickstart.md)

Document how to:

1. **Setup audit environment**
   ```bash
   npm install  # Ensure dependencies installed
   npm run lint  # Baseline check
   npm run size  # Current bundle size
   ```

2. **Run automated scans**
   ```bash
   # Component inventory
   node scripts/audit/component-analyzer.js
   
   # Design compliance
   node scripts/audit/design-compliance-checker.js
   
   # Accessibility
   npm run test:e2e:mobile  # Playwright a11y tests
   node scripts/audit/accessibility-scanner.js
   
   # Performance
   npm run size:why  # Bundle analysis
   node scripts/audit/performance-profiler.js
   ```

3. **Interpret results**
   - Where artifacts are stored
   - How to read JSON outputs
   - Severity level meanings
   - Priority ranking logic

4. **Manual testing procedures**
   - Screen reader testing steps
   - Mobile device testing checklist
   - Keyboard navigation validation
   - Pattern consistency review

5. **Generate reports**
   ```bash
   node scripts/audit/report-generator.js
   ```

### 4. Agent Context Update

Run agent context update script:

```bash
.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot
```

Add to agent context:
- Audit entity schemas
- Contract locations
- Audit methodology references
- Common audit patterns
- Report generation procedures

### Phase 1 Exit Criteria

- ✅ `data-model.md` complete with all 7 entity types defined
- ✅ All contract JSON schemas created and validated
- ✅ `quickstart.md` tested by running through procedures
- ✅ Agent context updated successfully
- ✅ Constitution Check re-evaluated (no new violations expected)

---

## Phase 2: Detailed Execution Plan

**Note**: Phase 2 (detailed task breakdown) is created by the `/speckit.tasks` command, NOT by this plan command. This section provides high-level execution strategy that will inform task creation.

### Execution Strategy Overview

The audit will be executed in 4 parallel workstreams over 4 weeks:

#### **Workstream 1: Component Architecture & Design Compliance** (Week 1-2)
- User Story 1: Component Architecture Analysis (P1)
- User Story 2: Design System Compliance Audit (P1)

#### **Workstream 2: Accessibility Assessment** (Week 1-2)
- User Story 3: Accessibility Compliance Assessment (P1)

#### **Workstream 3: Performance & Mobile-First** (Week 2-3)
- User Story 4: Mobile-First Implementation Review (P2)
- User Story 5: Performance Bottleneck Analysis (P2)

#### **Workstream 4: Patterns & Documentation** (Week 3-4)
- User Story 6: User Interaction Pattern Consistency Review (P3)
- User Story 7: Documentation and Pattern Library Creation (P3)

### Quality Gates

**Week 1 Checkpoint**: 
- Component inventory complete
- Design compliance baseline established
- Automated accessibility scans complete

**Week 2 Checkpoint**:
- All P1 user stories complete
- Manual accessibility testing 50% complete
- Performance profiling baseline established

**Week 3 Checkpoint**:
- All P2 user stories complete
- Pattern library 70% complete
- Remediation roadmap draft ready

**Week 4 Checkpoint**:
- All user stories complete
- Documentation finalized
- Stakeholder review completed
- Final audit report delivered

### Risk Mitigation

1. **Risk**: Audit scope creep from discovering more issues than expected
   - **Mitigation**: Strict prioritization by impact/effort, defer P3 findings if necessary

2. **Risk**: Automated tools produce high false positive rates
   - **Mitigation**: Manual validation sampling (10-20% of findings), tune tool configurations

3. **Risk**: Mobile device testing delays due to device availability
   - **Mitigation**: Use BrowserStack for remote device access, prioritize most common devices

4. **Risk**: Stakeholder availability for reviews
   - **Mitigation**: Schedule review sessions in advance, provide async review options

5. **Risk**: Dependency on ongoing feature development
   - **Mitigation**: Audit main branch snapshot, note active feature branches separately

---

## Audit Methodologies by User Story

### User Story 1: Component Architecture Analysis (P1 - Week 1-2)

**Objective**: Analyze 967 components to identify duplication and consolidation opportunities

**Methodology**:

1. **Automated Component Inventory** (Day 1-2)
   - Tool: Custom Node.js script using `@babel/parser` + `@babel/traverse`
   - Process:
     1. Scan `src/components/` recursively for `.tsx` files
     2. Parse each file to AST
     3. Extract: component name, exports, props, hooks used, imports
     4. Categorize: presentational vs container (hooks used, render patterns)
     5. Calculate LOC (excluding comments/whitespace)
   - Output: `component-inventory.json` (967 records)

2. **Duplication Detection** (Day 3-5)
   - Tool: `jsinspect` + manual pattern recognition
   - Process:
     1. Run jsinspect with similarity threshold 80%
     2. Group similar components by feature domain
     3. Manual review of flagged groups (20% sample)
     4. Identify exact duplicates (100% similar code)
     5. Identify near-duplicates (80-99% similar)
     6. Identify shared logic candidates (similar patterns, different implementations)
   - Output: `duplication-analysis.json`

3. **Consolidation Opportunity Prioritization** (Day 6-7)
   - Criteria:
     - Impact: LOC reduction + maintenance improvement
     - Effort: Complexity of consolidation + test updates needed
     - Risk: Breaking changes probability
   - Process:
     1. Score each duplication pattern (Impact × 2 - Effort)
     2. Rank by score descending
     3. Identify top 20 opportunities
     4. Document consolidation approach (reference UnifiedTrackCard pattern)
   - Output: Prioritized list in audit report

4. **Directory Structure Analysis** (Day 8-9)
   - Process:
     1. Map 109 component directories to feature domains
     2. Identify organizational inconsistencies (orphaned components, unclear naming)
     3. Propose taxonomy improvements (feature-first vs component-type-first)
     4. Document recommended reorganization
   - Output: Directory restructuring recommendations

**Success Metrics**:
- ✅ All 967 components inventoried
- ✅ ≥20 consolidation opportunities identified
- ✅ Top 10 opportunities have detailed consolidation plans
- ✅ Directory recommendations ready

---

### User Story 2: Design System Compliance Audit (P1 - Week 1-2)

**Objective**: Measure compliance against DESIGN_SYSTEM_SPECIFICATION.md (1,190 lines)

**Methodology**:

1. **Automated Color Violation Detection** (Day 1-2)
   - Tool: Custom script parsing Tailwind classes + inline styles
   - Process:
     1. Extract all className attributes from TSX files
     2. Identify hard-coded color values (hex, rgb, hsl)
     3. Check Tailwind color classes against allowed design tokens
     4. Flag non-standard colors (not in design system palette)
   - Output: Color violations by component

2. **Typography Compliance Scan** (Day 3-4)
   - Process:
     1. Extract font-family, font-size, font-weight, line-height from styles
     2. Compare against design system typography scale
     3. Flag custom values not in specification
     4. Identify missing responsive typography
   - Output: Typography violations by component

3. **Spacing System Validation** (Day 5-6)
   - Process:
     1. Extract padding, margin, gap values from Tailwind classes
     2. Check against design system spacing scale (4px, 8px, 12px, 16px, ...)
     3. Flag custom spacing values
     4. Identify inconsistent spacing patterns
   - Output: Spacing violations by component

4. **Component Pattern Compliance** (Day 7-8)
   - Process:
     1. Manual review of key component types (buttons, cards, modals, sheets)
     2. Compare implementations against shadcn/ui patterns
     3. Check MobileBottomSheet vs Dialog usage on mobile
     4. Validate LazyImage usage for images
     5. Verify unified component usage (MainLayout, BottomNavigation, MobileHeaderBar)
   - Output: Pattern violations by category

5. **Telegram Theme Integration** (Day 9-10)
   - Process:
     1. Review theme variable usage (`--tg-theme-*`)
     2. Test theme switching (light/dark/system)
     3. Identify components with hard-coded colors that don't respect theme
   - Output: Theming compatibility issues

**Success Metrics**:
- ✅ Compliance score calculated for all 967 components (0-100)
- ✅ Violations categorized by severity (critical/major/minor)
- ✅ ≥85% of violations have specific file:line references
- ✅ Recommended fixes documented for top 50 violations

---

### User Story 3: Accessibility Compliance Assessment (P1 - Week 1-2)

**Objective**: Assess WCAG 2.1 AA compliance across 46 pages

**Methodology**:

1. **Automated Accessibility Scans** (Day 1-3)
   - Tools: axe-core (via Playwright), Lighthouse, pa11y
   - Process:
     1. Run Playwright tests with axe-core integration on all 46 pages
     2. Run Lighthouse accessibility audits
     3. Consolidate findings, deduplicate violations
     4. Categorize by WCAG criterion (1.1.1, 1.4.3, 2.1.1, etc.)
     5. Map severity (critical, serious, moderate, minor)
   - Output: `accessibility-violations.json`

2. **Manual Keyboard Navigation Testing** (Day 4-5)
   - Process:
     1. Navigate each page using Tab, Enter, Esc, Arrow keys
     2. Verify focus indicators visible
     3. Test interactive elements (buttons, forms, modals, sheets)
     4. Identify keyboard traps
     5. Verify skip links present
     6. Check tab order logical
   - Output: Keyboard accessibility issues by page

3. **Screen Reader Testing** (Day 6-7)
   - Tools: NVDA (Windows), VoiceOver (macOS/iOS)
   - Process:
     1. Test critical user flows (homepage, generation, library, player)
     2. Verify ARIA label announcements
     3. Test dynamic content updates (toasts, modals)
     4. Check form validation error announcements
     5. Verify heading hierarchy (h1, h2, h3)
   - Output: Screen reader issues by flow

4. **Color Contrast Measurement** (Day 8-9)
   - Tool: axe-core + manual spot checks with WebAIM Contrast Checker
   - Process:
     1. Extract all text/background color pairs from automated scans
     2. Calculate contrast ratios
     3. Verify against WCAG AA (4.5:1 normal text, 3:1 large text)
     4. Test in Telegram light/dark themes
   - Output: Contrast failures by component

5. **Touch Accessibility on Mobile** (Day 10)
   - Process:
     1. Measure touch target sizes (should be 44-56px)
     2. Verify spacing between interactive elements (≥8px)
     3. Test touch states (visual feedback within 100ms)
     4. Verify haptic feedback via Telegram SDK
   - Output: Mobile touch accessibility issues

**Success Metrics**:
- ✅ All 46 pages scanned with automated tools
- ✅ 100% of WCAG Level A and AA violations documented
- ✅ Critical user flows tested with screen readers
- ✅ Contrast ratio calculated for ≥95% of text/bg pairs
- ✅ Touch target compliance measured for mobile components

---

### User Story 4: Mobile-First Implementation Review (P2 - Week 2-3)

**Objective**: Evaluate mobile-first quality and Telegram Mini App integration

**Methodology**:

1. **Touch Target Sizing Audit** (Day 1-2)
   - Process:
     1. Measure all interactive elements with browser DevTools
     2. Flag elements <44px width or height
     3. Prioritize by usage frequency (navigation, primary actions)
     4. Document current size and recommended size
   - Output: Touch target violations by component

2. **Responsive Breakpoint Testing** (Day 3-4)
   - Devices/Viewports:
     - 320px (iPhone SE)
     - 375px (iPhone 12/13)
     - 414px (iPhone 12 Pro Max)
     - 768px (iPad portrait)
   - Process:
     1. Load each page at each breakpoint
     2. Identify layout breaks, text overflow, horizontal scroll
     3. Test component responsiveness (cards, lists, forms)
     4. Verify Tailwind breakpoint usage (xs, sm, md, lg, xl)
   - Output: Responsive issues by page and breakpoint

3. **One-Handed Operation Assessment** (Day 5-6)
   - Process:
     1. Map interactive elements to thumb reach zones (easy, stretch, hard)
     2. Identify critical actions in hard-to-reach areas
     3. Evaluate bottom-anchored navigation (BottomNavigation component)
     4. Recommend layout adjustments for better ergonomics
   - Output: Ergonomic improvement opportunities

4. **Portrait/Landscape Orientation Testing** (Day 7)
   - Process:
     1. Test orientation lock implementation (should prioritize portrait)
     2. Verify graceful degradation in landscape
     3. Test orientation change handling
     4. Document landscape-specific issues
   - Output: Orientation handling status

5. **Telegram SDK Integration Validation** (Day 8-9)
   - Components:
     - MainButton usage for primary actions
     - BackButton navigation stack management
     - HapticFeedback triggers (light, medium, heavy, error, success)
     - Safe area handling (notch, Dynamic Island)
     - Virtual keyboard behavior (visualViewport API)
   - Process:
     1. Audit each integration point
     2. Test on iOS Safari and Chrome Android
     3. Verify haptic feedback consistency
     4. Check safe area padding on various devices
   - Output: Telegram integration compliance by component

**Success Metrics**:
- ✅ Touch target compliance measured for all interactive elements
- ✅ All 4 breakpoints tested on all pages
- ✅ Ergonomic assessment complete with recommendations
- ✅ Telegram SDK integration validated
- ✅ Mobile UX scorecard produced

---

### User Story 5: Performance Bottleneck Analysis (P2 - Week 2-3)

**Objective**: Identify UI rendering performance issues and optimization opportunities

**Methodology**:

1. **React DevTools Profiler Analysis** (Day 1-3)
   - Process:
     1. Profile each page during typical user interactions
     2. Identify components with >10 re-renders per interaction
     3. Analyze flame graphs for render time hotspots
     4. Trace re-render causes (props changes, context updates)
     5. Flag components without memoization opportunities
   - Output: Re-render bottlenecks by component

2. **Bundle Size Analysis** (Day 4-5)
   - Tool: `webpack-bundle-analyzer` via `npm run size:why`
   - Process:
     1. Generate bundle visualization
     2. Identify oversized modules (>100KB)
     3. Check code splitting effectiveness (vendor chunks, feature chunks)
     4. Validate lazy loading coverage (all pages React.lazy?)
     5. Compare against 950KB hard limit
     6. Identify duplicate dependencies
   - Output: Bundle optimization opportunities

3. **Lighthouse Performance Audits** (Day 6-7)
   - Process:
     1. Run Lighthouse on all 46 pages
     2. Record metrics: Performance score, FCP, LCP, TTI, CLS
     3. Identify pages with score <90
     4. Extract specific recommendations (image optimization, code splitting, etc.)
     5. Compare against performance goals (FCP <1.5s, LCP <2.5s, TTI <3.5s)
   - Output: Per-page performance scorecards

4. **Image Optimization Assessment** (Day 8)
   - Process:
     1. Identify all images (cover art, backgrounds, icons)
     2. Check LazyImage component usage
     3. Verify blur placeholder implementation
     4. Validate image formats (WebP preferred)
     5. Check size optimization (512×512px max for covers)
     6. Identify missing lazy loading
   - Output: Image optimization checklist

5. **List Virtualization Gap Analysis** (Day 9)
   - Process:
     1. Identify all lists with >50 items
     2. Check VirtualizedTrackList usage
     3. Measure DOM node counts
     4. Test scroll performance (should be 60fps)
     5. Flag lists needing virtualization
   - Output: Virtualization implementation gaps

6. **Animation Performance Testing** (Day 10)
   - Process:
     1. Profile animations with Chrome DevTools Performance tab
     2. Measure frame rates (target 60fps)
     3. Identify janky animations (frame drops)
     4. Check GPU-accelerated properties (transform, opacity)
     5. Verify Framer Motion @/lib/motion wrapper usage
     6. Test prefers-reduced-motion respect
   - Output: Animation performance issues

**Success Metrics**:
- ✅ All pages profiled with React DevTools
- ✅ Bundle size status confirmed (under/near/over 950KB limit)
- ✅ Lighthouse scores recorded for all pages
- ✅ Pages with score <90 have specific optimization plans
- ✅ Animation performance validated
- ✅ Performance baseline established for before/after comparison

---

### User Story 6: User Interaction Pattern Consistency Review (P3 - Week 3)

**Objective**: Document interaction patterns and identify inconsistencies

**Methodology**:

1. **Navigation Pattern Audit** (Day 1-2)
   - Process:
     1. Map navigation patterns across all pages
     2. Document back button behavior
     3. Check breadcrumb usage consistency
     4. Verify navigation hierarchy clarity
     5. Test deep linking patterns
   - Output: Navigation pattern documentation + inconsistencies

2. **Form Submission Flow Analysis** (Day 3-4)
   - Process:
     1. Identify all forms (generation, profile, settings, search)
     2. Document loading states (spinner, skeleton, disabled button)
     3. Check success confirmation patterns (toast, modal, redirect)
     4. Evaluate error handling consistency (inline, toast, modal)
     5. Verify validation feedback timing (on blur, on submit)
   - Output: Form pattern standardization plan

3. **Confirmation Dialog Assessment** (Day 5)
   - Process:
     1. Identify all destructive actions (delete, remove, clear)
     2. Check confirmation dialog presence
     3. Verify warning message clarity
     4. Document button labeling (Cancel vs No, Delete vs Yes)
     5. Identify missing confirmations
   - Output: Confirmation pattern recommendations

4. **Loading & Empty State Review** (Day 6-7)
   - Process:
     1. Catalog all loading states (skeleton, spinner, shimmer)
     2. Document empty state implementations (no tracks, no playlists)
     3. Check CTA presence in empty states
     4. Verify loading indicator consistency
     5. Identify missing states
   - Output: State pattern library

5. **Notification Pattern Mapping** (Day 8)
   - Process:
     1. Document all user feedback mechanisms (toast, modal, inline)
     2. Check notification timing and duration
     3. Verify action buttons in notifications (Undo, Retry)
     4. Identify inconsistent notification types
   - Output: Notification standardization guidelines

6. **Error Boundary Coverage** (Day 9)
   - Process:
     1. Identify error boundary placements
     2. Test error scenarios
     3. Verify error recovery UX
     4. Check missing error boundaries
   - Output: Error handling improvement plan

**Success Metrics**:
- ✅ All interaction pattern types documented
- ✅ Inconsistencies identified and categorized
- ✅ Recommended standard patterns defined
- ✅ Affected components listed for each standardization

---

### User Story 7: Documentation and Pattern Library Creation (P3 - Week 4)

**Objective**: Synthesize findings into actionable documentation

**Methodology**:

1. **Consolidated Audit Report** (Day 1-3)
   - Structure:
     1. Executive Summary (1 page)
        - Overall health score
        - Critical issues count
        - Key recommendations
     2. Findings by Category (15-20 pages)
        - Component Architecture
        - Design System Compliance
        - Accessibility
        - Mobile-First Implementation
        - Performance
        - Interaction Patterns
     3. Metrics and Scores
        - Baseline metrics
        - Compliance percentages
        - Performance benchmarks
     4. Prioritized Recommendations
        - Top 50 issues ranked by impact/effort
     5. Remediation Roadmap
        - Phase 1 (Critical/High - Weeks 1-4)
        - Phase 2 (Medium - Weeks 5-8)
        - Phase 3 (Low/Enhancements - Weeks 9-12)
     6. Appendices
        - Full component inventory
        - Pattern library
        - Consolidation playbook
   - Output: `audit-report.md` (master document)

2. **Pattern Library Creation** (Day 4-6)
   - Patterns to document (minimum 15):
     1. UnifiedTrackCard pattern
     2. MobileBottomSheet pattern
     3. Lazy loading pattern (React.lazy + Suspense)
     4. LazyImage pattern (blur placeholder + shimmer)
     5. VirtualizedTrackList pattern
     6. Form validation pattern
     7. Loading state pattern (skeleton loaders)
     8. Empty state pattern
     9. Confirmation dialog pattern
     10. Toast notification pattern
     11. Error boundary pattern
     12. Haptic feedback pattern
     13. Safe area handling pattern
     14. Keyboard navigation pattern
     15. ARIA labeling pattern
   - Each pattern includes:
     - Description and use case
     - Code example
     - Do's and Don'ts
     - Accessibility notes
     - Performance considerations
     - Related components
   - Output: `pattern-library/` directory with 15+ markdown files

3. **Consolidation Playbook** (Day 7-8)
   - Guides to create:
     1. Card Component Consolidation Guide
        - Step-by-step based on UnifiedTrackCard success
        - Test update procedures
        - Rollout strategy
     2. Modal Standardization Guide
        - MobileBottomSheet on mobile, Dialog on desktop
        - Migration checklist
     3. Image Loading Standardization Guide
        - LazyImage adoption
        - Blur placeholder generation
     4. List Virtualization Guide
        - VirtualizedTrackList integration
        - Performance validation
   - Each guide includes:
     - Before/after code examples
     - Risk assessment
     - Testing checklist
     - Rollback plan
   - Output: `consolidation-playbook/` directory

4. **Design System Enhancement Recommendations** (Day 9)
   - Process:
     1. Identify gaps in DESIGN_SYSTEM_SPECIFICATION.md
     2. Propose new design tokens (colors, spacing, typography)
     3. Recommend new component patterns
     4. Document missing guidelines (e.g., animation timing standards)
   - Output: Design system update proposal

5. **Best Practices Documentation** (Day 10)
   - Update CLAUDE.md with:
     - Common UI/UX pitfalls discovered
     - Audit-informed coding standards
     - Component usage guidelines
     - Performance optimization patterns
   - Output: Updated CLAUDE.md

**Success Metrics**:
- ✅ Comprehensive audit report completed
- ✅ Pattern library with ≥15 patterns documented
- ✅ Consolidation playbook with ≥4 guides
- ✅ Design system enhancement recommendations ready
- ✅ All documentation reviewed and approved by stakeholders

---

## Timeline & Milestones

### Week 1: Foundation (P1 Focus)

**Days 1-5: Phase 0 Research + Phase 1 Design (Parallel)**
- ☐ Tool selection and methodology research (Phase 0)
- ☐ Data model design (Phase 1)
- ☐ Contract schemas created (Phase 1)
- ☐ Quickstart guide drafted (Phase 1)

**Days 6-10: P1 User Stories Begin**
- ☐ Component inventory automated scan complete (US1)
- ☐ Duplication detection started (US1)
- ☐ Design system compliance scan started (US2)
- ☐ Automated accessibility scans complete (US3)

**Week 1 Checkpoint (Friday)**:
- ✅ research.md complete and approved
- ✅ data-model.md complete
- ✅ Contracts created
- ✅ Component inventory complete (967 components catalogued)
- ✅ 50% of design compliance scan complete
- ✅ Automated a11y scans complete on all 46 pages

---

### Week 2: P1 Completion + P2 Start

**Days 11-15: P1 Finalization**
- ☐ Duplication analysis complete with top 20 opportunities (US1)
- ☐ Design system compliance scoring complete (US2)
- ☐ Manual keyboard navigation testing complete (US3)
- ☐ Screen reader testing 50% complete (US3)

**Days 16-20: P2 User Stories Begin**
- ☐ Touch target sizing audit started (US4)
- ☐ React DevTools profiling started (US5)
- ☐ Bundle size analysis complete (US5)

**Week 2 Checkpoint (Friday)**:
- ✅ All P1 user stories complete (US1, US2, US3)
- ✅ Component consolidation opportunities prioritized
- ✅ Design compliance baseline established
- ✅ Accessibility violations documented with WCAG references
- ✅ Performance profiling baseline established

---

### Week 3: P2 Completion + P3 Start

**Days 21-25: P2 Finalization**
- ☐ Responsive breakpoint testing complete (US4)
- ☐ Telegram SDK integration validated (US4)
- ☐ Lighthouse audits complete all pages (US5)
- ☐ Animation performance tested (US5)

**Days 26-30: P3 User Stories**
- ☐ Navigation pattern audit complete (US6)
- ☐ Form submission flow analysis complete (US6)
- ☐ Pattern library 50% complete (US7)

**Week 3 Checkpoint (Friday)**:
- ✅ All P2 user stories complete (US4, US5)
- ✅ Mobile UX scorecard produced
- ✅ Performance bottlenecks prioritized
- ✅ Interaction pattern analysis 75% complete
- ✅ Pattern library 70% complete

---

### Week 4: Finalization & Delivery

**Days 31-35: Documentation Sprint**
- ☐ Interaction pattern review complete (US6)
- ☐ Consolidated audit report drafted (US7)
- ☐ Pattern library complete (US7)
- ☐ Consolidation playbook complete (US7)

**Days 36-40: Review & Refinement**
- ☐ Stakeholder review sessions
- ☐ Documentation refinements based on feedback
- ☐ Final audit report finalized
- ☐ Remediation roadmap validated

**Week 4 Checkpoint (Friday) - Final Delivery**:
- ✅ All 7 user stories complete (US1-US7)
- ✅ Comprehensive audit report delivered
- ✅ Pattern library with ≥15 patterns
- ✅ Consolidation playbook with ≥4 guides
- ✅ Remediation roadmap prioritized and approved
- ✅ All artifacts stored in `specs/001-ui-ux-audit/artifacts/`
- ✅ Success criteria met (SC-001 through SC-012)

---

## Deliverables Checklist

### Documentation

- ☐ `plan.md` - This implementation plan
- ☐ `research.md` - Phase 0 research findings
- ☐ `data-model.md` - Audit entity definitions
- ☐ `quickstart.md` - Audit execution guide
- ☐ `contracts/` - 7 JSON schemas

### Artifacts

- ☐ `component-inventory.json` - 967 component records
- ☐ `duplication-analysis.json` - Duplication patterns
- ☐ `design-compliance-report.json` - Design violations
- ☐ `accessibility-violations.json` - WCAG issues
- ☐ `performance-profile.json` - Performance bottlenecks
- ☐ `interaction-patterns.json` - UX inconsistencies
- ☐ `remediation-roadmap.json` - Prioritized fixes

### Reports

- ☐ `audit-report.md` - Comprehensive audit report (master document)
- ☐ `pattern-library/` - 15+ reusable patterns
- ☐ `consolidation-playbook/` - 4+ step-by-step guides
- ☐ Design system enhancement recommendations
- ☐ Updated CLAUDE.md with audit insights

### Validation

- ☐ All success criteria (SC-001 through SC-012) met
- ☐ Stakeholder sign-off received
- ☐ Ready for Phase 2 task breakdown (`/speckit.tasks`)

---

## Success Criteria Validation

| ID | Criterion | Target | Validation Method |
|---|---|---|---|
| SC-001 | Component inventory | 967 components | Count records in `component-inventory.json` |
| SC-002 | Design compliance | ≥85% violations documented | Check `design-compliance-report.json` completeness |
| SC-003 | Accessibility assessment | 100% Level A/AA violations | Verify `accessibility-violations.json` against WCAG checklist |
| SC-004 | Performance baseline | All pages profiled | Confirm Lighthouse scores for 46 pages in `performance-profile.json` |
| SC-005 | Consolidation opportunities | ≥20 identified | Count entries in `duplication-analysis.json` |
| SC-006 | Pattern library | ≥15 patterns | Count files in `pattern-library/` |
| SC-007 | Remediation roadmap | All issues ranked | Verify `remediation-roadmap.json` has impact/effort scores |
| SC-008 | Audit documentation | Complete and reviewed | Confirm stakeholder sign-off on `audit-report.md` |
| SC-009 | Technical debt quantified | Metrics calculated | Check audit report executive summary metrics section |
| SC-010 | Baseline metrics | Before/after enabled | Verify baseline recorded in audit report |
| SC-011 | Timeline adherence | 4 weeks | Confirm completion within Week 4 |
| SC-012 | Team validation | Sign-off received | Document approval in audit report metadata |

---

## Next Steps

1. **Approve this implementation plan** - Review with stakeholders
2. **Execute Phase 0** - Run research and tool selection (Week 1)
3. **Execute Phase 1** - Design audit contracts and quickstart (Week 1)
4. **Begin execution** - Start audit workstreams (Week 1-4)
5. **Weekly checkpoints** - Review progress against milestones
6. **Final delivery** - Week 4 audit report and artifacts
7. **Phase 2 task breakdown** - Run `/speckit.tasks` to create detailed task list for optimization execution phase

---

**Plan Version**: 1.0.0  
**Last Updated**: 2026-01-05  
**Status**: Ready for Review
