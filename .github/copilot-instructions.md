# GitHub Copilot Instructions for MusicVerse AI

## Project Overview

MusicVerse AI is a professional AI-powered music creation platform built as a Telegram Mini App. The platform integrates with Suno AI v5 to generate music with advanced controls including 174+ meta tags, 277+ musical styles, and support for 75+ languages.

**Key Technologies:**
- React 19 + TypeScript 5
- Vite for build tooling
- Supabase for backend/database
- Telegram Mini App SDK (@twa-dev/sdk)
- TanStack Query for data management
- Tailwind CSS + shadcn/ui components
- Zustand for state management

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Preview production build
npm preview

# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Storybook (component development)
npm run storybook
npm run build-storybook
```

## Code Style and Standards

### TypeScript/JavaScript
- Use **Prettier** for all formatting (config in `.prettierrc.json`)
- Run `npm run format` before committing
- Follow ESLint rules (config in `eslint.config.js`)
- Use strict TypeScript settings from `tsconfig.json`

### React Best Practices
- Follow [React Hooks rules](https://reactjs.org/docs/hooks-rules.html)
- Use functional components with hooks (no class components)
- Prefer composition over inheritance
- Use custom hooks for reusable logic

### Naming Conventions
- **Components:** `PascalCase` (e.g., `BottomNavigation`, `MusicPlayer`)
- **Variables/Functions:** `camelCase` (e.g., `telegramUser`, `handlePlayback`)
- **Types/Interfaces:** `PascalCase` (e.g., `TelegramUser`, `MusicTrack`)
- **Constants:** `UPPER_SNAKE_CASE` for true constants (e.g., `MAX_PROMPT_LENGTH`)
- **Files:** 
  - Components: `PascalCase.tsx`
  - Utilities/Hooks: `camelCase.ts`
  - Types: `types.ts` or `PascalCase.types.ts`

### Comments and Documentation
- Use `// TODO:` for features to be added
- Use `// FIXME:` for issues to be fixed
- Document complex logic with clear comments
- Add JSDoc comments for exported functions/types
- CI automatically creates issues from TODO/FIXME comments

### Import Organization
1. External dependencies (React, libraries)
2. Internal absolute imports (from `src/`)
3. Relative imports
4. Style imports (if any)

Example:
```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';

import { formatDuration } from './utils';
```

## Git Workflow

### Branch Strategy (GitFlow)
- **`main`**: Production-ready code
- **`develop`**: Integration branch for new features
- **`feature/*`**: New features (e.g., `feature/audio-player`)
- **`bugfix/*`**: Bug fixes (e.g., `bugfix/playback-issue`)
- **`hotfix/*`**: Urgent production fixes

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `ci`: CI/CD changes
- `chore`: Other changes (dependencies, etc.)

**Examples:**
```
feat(auth): add Apple ID login support
fix(player): resolve audio playback stuttering
docs(readme): update installation instructions
refactor(api): simplify music generation logic
```

### Pull Request Process
1. Create PR from `feature/*` or `bugfix/*` to `develop`
2. Ensure all CI checks pass (build, test, lint)
3. Get approval from at least one team member
4. Use the PR template (if available)
5. Squash commits when merging (if needed)

## Directory Structure

```
aimusicverse/
├── .github/              # GitHub configuration (workflows, agents)
├── .storybook/           # Storybook configuration
├── docs/                 # Project documentation
├── public/               # Static assets
├── src/                  # Source code
│   ├── assets/          # Images, icons, fonts
│   ├── components/      # React components
│   │   ├── ui/         # shadcn/ui base components
│   │   └── ...         # Feature-specific components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and helpers
│   ├── pages/          # Page components
│   ├── services/       # API services (Supabase, etc.)
│   ├── stores/         # Zustand state stores
│   ├── types/          # TypeScript type definitions
│   └── main.tsx        # Application entry point
├── supabase/            # Supabase configuration/migrations
└── verification/        # Verification scripts
```

## Key Components and Patterns

### Telegram Mini App Integration
- Use `@twa-dev/sdk` for Telegram features
- Access via `useTelegram()` hook
- Handle Telegram theme, user data, and navigation
- Use Telegram's cloud storage for settings sync

### State Management
- **Zustand** for global state (user preferences, app state)
- **TanStack Query** for server state (API data, caching)
- Local state with `useState` for component-specific data

### UI Components
- Use **shadcn/ui** components from `src/components/ui/`
- Customize with Tailwind classes
- Follow existing component patterns
- Ensure mobile-first responsive design

### API Integration
- Supabase client in `src/lib/supabase.ts`
- Use TanStack Query for data fetching
- Handle loading/error states consistently
- Implement proper error boundaries

## Testing Guidelines

### Test Structure
- Place tests next to components or in `__tests__` folders
- Use Jest + Testing Library
- File naming: `ComponentName.test.tsx`

### Test Types
- Unit tests for utilities and hooks
- Integration tests for component interactions
- Mock Supabase and external APIs
- Test accessibility (a11y) requirements

### Coverage Requirements
- Run `npm test:coverage` to check coverage
- Aim for >80% coverage on new code
- Critical paths must have tests

## Acceptance Criteria for Contributions

Before submitting a PR, ensure:

1. **Code Quality:**
   - [ ] Code is formatted with Prettier (`npm run format`)
   - [ ] No ESLint errors (`npm run lint`)
   - [ ] TypeScript types are properly defined (no `any` unless justified)
   - [ ] Code follows naming conventions

2. **Functionality:**
   - [ ] Feature works as expected
   - [ ] No console errors or warnings
   - [ ] Mobile-responsive (test on different screen sizes)
   - [ ] Works in Telegram Mini App context

3. **Testing:**
   - [ ] Tests added for new features/fixes
   - [ ] All tests pass (`npm test`)
   - [ ] Coverage maintained or improved

4. **Documentation:**
   - [ ] Code is self-documenting or has comments
   - [ ] README updated if needed
   - [ ] API changes documented

5. **Build:**
   - [ ] Project builds successfully (`npm run build`)
   - [ ] No build warnings
   - [ ] Bundle size is reasonable

## Security and Privacy

- **Never commit secrets** (API keys, tokens, passwords)
- Use environment variables (`.env` file, not committed)
- Validate user input on both client and server
- Follow OWASP security best practices
- Handle personal data according to privacy policies

## Performance Considerations

- Optimize images (use appropriate formats and sizes)
- Lazy load components when appropriate
- Minimize bundle size (check with build output)
- Use React.memo() for expensive renders
- Implement proper caching strategies

## Multilingual Support

The project supports 75+ languages:
- Use i18n for all user-facing text
- Follow existing translation patterns
- Test with different language settings
- Consider RTL (right-to-left) languages

## Music Generation Specifics

When working on music generation features:
- Respect Suno AI v5 API limits and quotas
- Handle 174+ meta tags properly
- Support 277+ music styles
- Validate prompt length (up to 5000 characters)
- Implement proper error handling for generation failures
- Cache generated tracks appropriately

## CI/CD

- Automated builds run on push to `main` and `develop`
- Quality checks run on all PRs
- TODO/FIXME scanner creates issues automatically
- Ensure CI passes before merging

## Resources and Documentation

- [Main README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Development Workflow](../DEVELOPMENT_WORKFLOW.md)
- [Project Management](../PROJECT_MANAGEMENT.md)
- [Meta Tags Documentation](../docs/META_TAGS.md)
- [Music Styles](../docs/STYLES.md)
- [Language Support](../docs/LANGUAGES.md)

## Questions or Issues?

- Check existing documentation first
- Search for similar issues
- Ask in team communication channels
- Create a well-scoped issue with clear description

---

**Note:** This project is under active development. These instructions may be updated. Check the latest version in the repository.
