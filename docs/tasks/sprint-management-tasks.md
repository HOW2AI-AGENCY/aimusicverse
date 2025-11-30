# Implementation Tasks: Sprint Management System

**Plan**: [docs/plans/sprint-management-plan.md](../plans/sprint-management-plan.md)

## Phase 1: Data Model

- [ ] **TASK-SPRINT-001**: Create `sprints` table migration. <!-- id: 200 -->
- [ ] **TASK-SPRINT-002**: Update `tasks` table with `sprint_id`, `story_points`, `assignee_id`. <!-- id: 201 -->
- [ ] **TASK-SPRINT-003**: Verify RLS policies for new tables. <!-- id: 202 -->

## Phase 2: API & Logic

- [ ] **TASK-SPRINT-004**: Create Supabase hooks for Sprints (`useSprints`, `useCreateSprint`). <!-- id: 203 -->
- [ ] **TASK-SPRINT-005**: Create Supabase hooks for Task Assignment (`useAssignTask`). <!-- id: 204 -->
- [ ] **TASK-SPRINT-006**: Implement velocity calculation utility. <!-- id: 205 -->

## Phase 3: UI Implementation

- [ ] **TASK-SPRINT-007**: Create `SprintDashboard` component skeleton. <!-- id: 206 -->
- [ ] **TASK-SPRINT-008**: Implement "Current Sprint" progress card. <!-- id: 207 -->
- [ ] **TASK-SPRINT-009**: Implement `SprintTaskList` with filtering. <!-- id: 208 -->
- [ ] **TASK-SPRINT-010**: Create `SprintPlanning` view. <!-- id: 209 -->

## Phase 4: Verification

- [ ] **TASK-SPRINT-011**: Write unit test for velocity calculation. <!-- id: 210 -->
- [ ] **TASK-SPRINT-012**: Manual verification of sprint creation flow. <!-- id: 211 -->
