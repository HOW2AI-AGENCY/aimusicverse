# Technical Plan: Sprint Management System

**Feature Branch**: `feature/sprint-management`
**Spec**: [docs/specs/sprint-management.md](../specs/sprint-management.md)
**Status**: Approved

## Technical Context

- **Frontend**: React, Shadcn/UI (Cards, Progress Bars, Tables).
- **Backend**: Supabase (PostgreSQL).
- **State**: TanStack Query.

## Phase 1: Data Model

1.  **Table: `sprints`**
    -   `id`: uuid (PK)
    -   `name`: text
    -   `start_date`: date
    -   `end_date`: date
    -   `status`: text (active, planned, completed)
    -   `goal`: text
    -   `created_at`: timestamp

2.  **Table: `tasks` (Update)**
    -   Add `sprint_id`: uuid (FK -> sprints.id)
    -   Add `story_points`: integer
    -   Add `assignee_id`: uuid (FK -> profiles.id)

## Phase 2: API & Logic

1.  **Supabase Hooks**:
    -   Use `useQuery` to fetch active sprint details.
    -   Use `useMutation` for creating/updating sprints.
    -   Use `useMutation` for assigning tasks.

2.  **Calculations**:
    -   Velocity = Sum of `story_points` for completed tasks in past sprints.
    -   Progress = (Completed Points / Total Points) * 100.

## Phase 3: UI Implementation

1.  **Dashboard Component (`SprintDashboard.tsx`)**:
    -   Display "Current Sprint" card with progress bar.
    -   Display "Burndown" chart (using Recharts or simple SVG).
    -   Display "Team Velocity" metric.

2.  **Task List Component (`SprintTaskList.tsx`)**:
    -   Filterable list of tasks by sprint.
    -   Drag-and-drop (optional, or simple dropdown) to move tasks between sprints.

3.  **Planning View (`SprintPlanning.tsx`)**:
    -   Split view: Backlog vs. Future Sprints.
    -   Assignment controls.

## Phase 4: Verification

1.  **Tests**:
    -   Unit test for velocity calculation logic.
    -   Integration test for assigning task to sprint.
