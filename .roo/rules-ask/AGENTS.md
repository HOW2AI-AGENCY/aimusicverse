# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Project Context

- **Knowledge graph**: Graphify system with output in `graphify-out/`; query with `graphify query "<question>"`
- **Commands system**: Speckit workflow commands in `.roo/commands/` (`speckit.specify.md`, `speckit.tasks.md`, `speckit.taskstoissues.md`)
- **Specialized agents**: 4 agents in `.claude/agents/` — codebase-analyzer, github-repo-auditor, spec-driven-developer, ux-ui-mobile-designer
- **Build pipeline**: `npm run check:design-tokens` (custom ESLint plugin) runs before `vite build`
- **CSS structure**: 5 CSS files in `src/styles/` (not a single file) — loaded together in `src/main.tsx`
- **Documentation**: Extensive `docs/` directory with ~50+ files covering architecture, security, deployment, testing, Telegram integration
- **Bundle budget**: `size-limit` enforces 950KB total gzip across 11 named chunks
