# Quickstart Guide: UI/UX Improvements

**Version**: 1.0.0  
**Last Updated**: 2025-12-01

## Overview

This guide helps developers get started with the UI/UX improvements implementation, including database setup, development environment, and feature usage.

---

## Prerequisites

- Node.js 18+ and npm/bun
- Supabase CLI installed
- Git for version control
- Code editor (VS Code recommended)

---

## Initial Setup

### 1. Clone and Install

```bash
# Navigate to project
cd /path/to/aimusicverse

# Install dependencies
npm install
# or
bun install

# Verify installation
npm list react react-dom typescript
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add required values:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup

#### Run Migrations

```bash
# Link to Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Or use migration files directly
supabase migration up
```

#### Migration Files

The following migrations will be created (in order):

1. `add_master_version_to_tracks.sql`
2. `add_version_fields_to_track_versions.sql`
3. `create_track_changelog_table.sql`
4. `create_playlists_tables.sql`
5. `add_indexes_for_performance.sql`
6. `migrate_existing_data.sql`

#### Verify Migrations

```bash
# Check applied migrations
supabase migration list

# Verify table structure
supabase db dump --schema public
```

### 4. Data Migration (For Existing Data)

```sql
-- Set version numbers for existing versions
WITH numbered_versions AS (
  SELECT 
    id,
    track_id,
    ROW_NUMBER() OVER (PARTITION BY track_id ORDER BY created_at) as version_number
  FROM track_versions
)
UPDATE track_versions
SET version_number = numbered_versions.version_number
FROM numbered_versions
WHERE track_versions.id = numbered_versions.id;

-- Set first version as master
UPDATE track_versions
SET is_master = true
WHERE id IN (
  SELECT MIN(id)
  FROM track_versions
  GROUP BY track_id
);

-- Update tracks with master_version_id
UPDATE music_tracks
SET master_version_id = (
  SELECT id
  FROM track_versions
  WHERE track_id = music_tracks.id
    AND is_master = true
  LIMIT 1
);
```

---

## Development

### Start Development Server

```bash
# Start Vite dev server
npm run dev

# Open in browser
# http://localhost:5173
```

### Mobile Testing

```bash
# Start with network access
npm run dev -- --host

# Access from mobile device
# http://<your-ip>:5173
```

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage

# E2E tests (requires separate terminal with dev server)
npm run test:e2e

# Run specific test file
npm test -- TrackCard.test.tsx
```

### Linting and Formatting

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
tsc --noEmit
```

---

## Feature Usage

### 1. Version Management

#### Using the Version Switcher Hook

```typescript
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';

function MyComponent({ trackId }: { trackId: string }) {
  const {
    versions,
    masterVersion,
    isLoading,
    switchVersion,
    error
  } = useVersionSwitcher(trackId);
  
  if (isLoading) return <div>Loading versions...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h3>Current: Version {masterVersion?.version_number}</h3>
      
      <select
        value={masterVersion?.id}
        onChange={(e) => switchVersion(e.target.value)}
      >
        {versions.map(v => (
          <option key={v.id} value={v.id}>
            Version {v.version_number} ({v.version_type})
          </option>
        ))}
      </select>
    </div>
  );
}
```

#### Using the Version Switcher Component

```typescript
import { VersionSwitcher } from '@/components/library/VersionSwitcher';

function TrackDetails({ track }: { track: Track }) {
  return (
    <div>
      <h2>{track.title}</h2>
      <VersionSwitcher trackId={track.id} />
    </div>
  );
}
```

### 2. Public Content Discovery

#### Fetching Public Tracks

```typescript
import { usePublicContent } from '@/hooks/usePublicContent';

function HomePage() {
  const {
    tracks,
    projects,
    artists,
    isLoading,
    error,
    refetch
  } = usePublicContent({
    trackSort: 'popular',
    trackLimit: 12,
    projectLimit: 6,
    artistLimit: 6
  });
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div>
      <section>
        <h2>Popular Tracks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map(track => (
            <PublicTrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>
      
      <section>
        <h2>Featured Projects</h2>
        {/* ... */}
      </section>
    </div>
  );
}
```

#### Public Track Card

```typescript
import { PublicTrackCard } from '@/components/home/PublicTrackCard';

<PublicTrackCard 
  track={track}
  onPlay={() => handlePlay(track)}
  onRemix={() => handleRemix(track)}
  onLike={() => handleLike(track)}
/>
```

### 3. Player State Management

#### Using the Player Store

```typescript
import { usePlayerStore } from '@/hooks/usePlayerState';

function PlayerContainer() {
  const {
    track,
    version,
    state,
    isPlaying,
    currentTime,
    duration,
    queue,
    playTrack,
    pause,
    resume,
    seek,
    setState,
    setVolume
  } = usePlayerStore();
  
  // Play a track
  const handlePlayTrack = (track: Track) => {
    playTrack(track);
  };
  
  // Change player state
  const expandPlayer = () => {
    setState('expanded');
  };
  
  return (
    <>
      {state === 'compact' && <CompactPlayer />}
      {state === 'expanded' && <ExpandedPlayer />}
      {state === 'fullscreen' && <FullscreenPlayer />}
    </>
  );
}
```

#### Player Components

```typescript
// Compact Player (bottom bar)
import { CompactPlayer } from '@/components/player/CompactPlayer';

<CompactPlayer 
  onExpand={() => setState('expanded')}
/>

// Expanded Player (overlay)
import { ExpandedPlayer } from '@/components/player/ExpandedPlayer';

<ExpandedPlayer
  onCollapse={() => setState('compact')}
  onFullscreen={() => setState('fullscreen')}
/>

// Fullscreen Player
import { FullscreenPlayer } from '@/components/player/FullscreenPlayer';

<FullscreenPlayer
  onClose={() => setState('expanded')}
/>
```

### 4. Queue Management

```typescript
import { usePlaybackQueue } from '@/hooks/usePlaybackQueue';

function QueueManager() {
  const {
    queue,
    history,
    nextTrack,
    previousTrack,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setRepeatMode,
    toggleShuffle
  } = usePlaybackQueue();
  
  return (
    <div>
      <h3>Queue ({queue.length} tracks)</h3>
      
      <div>
        <button onClick={() => setRepeatMode('off')}>
          Repeat Off
        </button>
        <button onClick={() => setRepeatMode('one')}>
          Repeat One
        </button>
        <button onClick={() => setRepeatMode('all')}>
          Repeat All
        </button>
        <button onClick={toggleShuffle}>
          Shuffle {queue.shuffle ? 'On' : 'Off'}
        </button>
      </div>
      
      <ul>
        {queue.queue.map(track => (
          <li key={track.id}>
            {track.title}
            <button onClick={() => removeFromQueue(track.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 5. Assistant Mode Form

#### Using the Assistant Wizard

```typescript
import { AssistantWizard } from '@/components/generate/assistant/AssistantWizard';

function GeneratePage() {
  const handleComplete = (formData: AssistantFormState) => {
    // Submit generation request
    console.log('Generating track with:', formData);
  };
  
  return (
    <div>
      <h1>AI Assistant</h1>
      <AssistantWizard 
        onComplete={handleComplete}
        onCancel={() => navigate('/library')}
      />
    </div>
  );
}
```

#### Form State Hook

```typescript
import { useAssistantForm } from '@/hooks/useAssistantForm';

function CustomWizard() {
  const {
    formState,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    updateField,
    validate,
    isValid,
    errors
  } = useAssistantForm({
    initialMode: 'prompt'
  });
  
  return (
    <div>
      <ProgressIndicator current={currentStep} total={totalSteps} />
      
      {/* Step content based on currentStep */}
      {currentStep === 1 && (
        <StepPrompt 
          value={formState.prompt}
          onChange={(v) => updateField('prompt', v)}
          error={errors.prompt}
        />
      )}
      
      <div>
        {currentStep > 1 && (
          <button onClick={prevStep}>Back</button>
        )}
        <button 
          onClick={nextStep}
          disabled={!isValid}
        >
          {currentStep === totalSteps ? 'Generate' : 'Next'}
        </button>
      </div>
    </div>
  );
}
```

### 6. Track Actions

#### Track Actions Menu

```typescript
import { TrackActionsMenu } from '@/components/track-actions/TrackActionsMenu';

<TrackActionsMenu
  track={track}
  onDelete={() => handleDelete(track.id)}
  onDownload={() => handleDownload(track)}
/>
```

#### Create Persona from Track

```typescript
import { CreatePersonaDialog } from '@/components/track-actions/CreatePersonaDialog';

const [dialogOpen, setDialogOpen] = useState(false);

<CreatePersonaDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  track={track}
  onSuccess={(persona) => {
    console.log('Persona created:', persona);
    toast.success('Persona created successfully!');
  }}
/>
```

#### Add to Playlist

```typescript
import { AddToProjectDialog } from '@/components/track-actions/AddToProjectDialog';

<AddToProjectDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  track={track}
  type="playlist"
  onSuccess={() => {
    toast.success('Added to playlist!');
  }}
/>
```

---

## Component Storybook

View components in isolation:

```bash
npm run storybook
```

Access at `http://localhost:6006`

---

## Common Tasks

### Add a New Component

```bash
# Create component file
touch src/components/my-feature/MyComponent.tsx

# Create test file
touch src/components/my-feature/MyComponent.test.tsx

# Create story file (optional)
touch src/components/my-feature/MyComponent.stories.tsx
```

### Debug Player Issues

```typescript
// Enable debug logging
import { usePlayerStore } from '@/hooks/usePlayerState';

const { enableDebug } = usePlayerStore();
enableDebug(true);

// Check player state
console.log('Player state:', usePlayerStore.getState());
```

### Test Responsive Design

```typescript
// Use mobile hook
import { useIsMobile } from '@/hooks/use-mobile';

function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {/* ... */}
    </div>
  );
}
```

### Monitor Performance

```typescript
// Use React DevTools Profiler
import { Profiler } from 'react';

<Profiler
  id="MyComponent"
  onRender={(id, phase, actualDuration) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  }}
>
  <MyComponent />
</Profiler>
```

---

## Troubleshooting

### Database Issues

**Issue**: Migrations fail
```bash
# Check migration status
supabase migration list

# Reset database (WARNING: destroys data)
supabase db reset

# Re-run migrations
supabase db push
```

**Issue**: Foreign key errors
```sql
-- Check referential integrity
SELECT * FROM music_tracks 
WHERE master_version_id IS NOT NULL 
  AND master_version_id NOT IN (SELECT id FROM track_versions);
```

### Player Issues

**Issue**: Audio not playing
- Check audio URL is valid and accessible
- Check browser console for CORS errors
- Verify Supabase storage permissions

**Issue**: Lyrics not syncing
- Verify `timestamped_lyrics` field has correct format
- Check `currentTime` is updating correctly
- Ensure word timestamps are in seconds (not ms)

### Performance Issues

**Issue**: Slow rendering
```typescript
// Use React.memo for expensive components
export const TrackCard = React.memo(({ track }: Props) => {
  // ...
}, (prev, next) => prev.track.id === next.track.id);

// Use useMemo for expensive calculations
const sortedTracks = useMemo(() => 
  tracks.sort((a, b) => b.created_at - a.created_at),
  [tracks]
);
```

**Issue**: Large bundle size
```bash
# Analyze bundle
npm run build
npm run preview

# Check bundle size
npx vite-bundle-visualizer
```

---

## Best Practices

### Component Design

```typescript
// ✅ Good: Mobile-first, semantic, accessible
export const TrackCard = ({ track }: Props) => {
  return (
    <article 
      className="
        touch-manipulation
        rounded-lg overflow-hidden
        p-3 sm:p-4 md:p-5
        focus-visible:ring-2 focus-visible:ring-primary
      "
      role="article"
      aria-label={`Track: ${track.title}`}
    >
      {/* ... */}
    </article>
  );
};

// ❌ Bad: Desktop-first, no accessibility
export const TrackCard = ({ track }: Props) => {
  return (
    <div className="p-8">
      <div onClick={handleClick}>
        {/* ... */}
      </div>
    </div>
  );
};
```

### State Management

```typescript
// ✅ Good: Use appropriate state solution
// - Local state for UI (useState)
// - Global state for shared data (Zustand)
// - Server state for API data (TanStack Query)

const [isOpen, setIsOpen] = useState(false); // UI state
const { track } = usePlayerStore(); // Global state
const { data: tracks } = useTracks(); // Server state

// ❌ Bad: Everything in global state
```

### Testing

```typescript
// ✅ Good: Test user behavior
test('switches version when selected', async () => {
  render(<VersionSwitcher trackId="123" />);
  
  const select = screen.getByRole('combobox');
  await userEvent.selectOptions(select, 'version-2');
  
  expect(screen.getByText('Version 2')).toBeInTheDocument();
});

// ❌ Bad: Test implementation details
test('calls switchVersion function', () => {
  const mockSwitch = jest.fn();
  render(<VersionSwitcher switchVersion={mockSwitch} />);
  // ...
});
```

---

## Resources

- [MusicVerse AI Documentation](../../../docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)

---

## Support

For issues or questions:
1. Check existing documentation
2. Search GitHub issues
3. Create new issue with reproduction steps
4. Tag with appropriate labels (bug, enhancement, question)

---

## Next Steps

1. ✅ Complete database setup
2. ✅ Run development server
3. ✅ Explore component examples
4. 🔄 Implement your feature
5. 🔄 Write tests
6. 🔄 Submit PR

Happy coding! 🎵
