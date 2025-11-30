# MusicVerse Constitution

## 1. Introduction

### 1.1 Purpose
The purpose of this Constitution is to define the immutable laws, governance structure, and development standards for the MusicVerse project. It serves as the supreme source of truth for all contributors.

### 1.2 Scope
This Constitution applies to all code, documentation, design assets, and processes within the MusicVerse repository. All contributors, regardless of role, are bound by these rules.

## 2. Project Vision

MusicVerse is a professional AI-powered music generation platform integrated into the Telegram ecosystem.
**Core Values:**
*   **User-Centricity**: The user experience is paramount.
*   **Quality**: Code must be robust, tested, and maintainable.
*   **Innovation**: We leverage cutting-edge AI (Suno v5) to deliver unique value.
*   **Accessibility**: The platform must be accessible globally (75+ languages).

## 3. Governance & Decision Making

*   **Benevolent Dictatorship**: The Project Lead has final say on architectural decisions and roadmap.
*   **RFC Process**: Major changes must go through a Request for Comments (RFC) process via the `speckit.specify` workflow.
*   **Code Review**: No code is merged without approval from at least one peer or the AI Architect.

## 4. Development Workflow (SpecKit)

We strictly adhere to the **SpecKit** workflow. "Code First" is prohibited.

### 4.1 The Cycle
1.  **Specify**: All features start with a specification (`/speckit.specify`).
2.  **Validate**: Requirements are validated via checklists (`/speckit.checklist`).
3.  **Plan**: A technical plan is generated (`/speckit.plan`).
4.  **Implement**: Code is written only after the plan is approved (`/speckit.implement`).

### 4.2 Rules of Engagement
*   **TDD**: Test-Driven Development is mandatory. Tests must be written before implementation code.
*   **Atomic Commits**: Commits should be small, focused, and descriptive.
*   **Branching**: Use `kebab-case` for branches (e.g., `feature/user-auth`, `fix/login-error`).

## 5. Technology Standards

### 5.1 Stack
*   **Frontend**: React 18+, TypeScript 5+, Vite, TailwindCSS, Shadcn/UI.
*   **Backend**: Supabase (Edge Functions, PostgreSQL, Auth, Storage).
*   **AI**: Suno AI v5 API.
*   **Platform**: Telegram Mini Apps SDK.

### 5.2 Coding Conventions
*   **TypeScript**: Strict mode enabled. No `any`.
*   **Styling**: TailwindCSS utility classes. No CSS-in-JS libraries unless approved.
*   **State**: TanStack Query for server state, React Context for global UI state.
*   **Comments**: JSDoc for all public functions and components.

## 6. Documentation

*   **Language**: Primary documentation is in **Russian** (target audience) and **English** (technical standard).
*   **Location**: All documentation resides in `docs/` or `.specify/`.
*   **Living Documents**: `README.md` and `docs/` must be kept in sync with code changes.

## 7. Amendments

This Constitution may be amended only through a formal proposal and review process involving the Project Lead.
