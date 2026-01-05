# Quick Start Guide: Unified Components

**Feature**: 002-ui-component-unification
**Audience**: Developers working on MusicVerse AI codebase
**Purpose**:快速上手统一组件的使用

## Table of Contents

1. [Overview](#overview)
2. [UnifiedDialog Component](#unifieddialog-component)
3. [UnifiedSkeleton Component](#unifiedskeleton-component)
4. [UnifiedFormInput Component](#unifiedforminput-component)
5. [Migration Guide](#migration-guide)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Overview

Unified components provide consistent, type-safe, and accessible UI patterns across the MusicVerse AI application. They replace duplicate component implementations with a single entry point that supports multiple variants through discriminated union types.

**Benefits**:
- **Type Safety**: TypeScript discriminated unions provide accurate intellisense for each variant
- **Consistency**: All dialogs, skeletons, and forms follow the same patterns
- **Mobile-First**: Components are optimized for Telegram Mini App (44-56px touch targets, haptic feedback)
- **Accessibility**: WCAG AA compliant with proper ARIA labels, keyboard navigation, and focus management
- **Performance**: Shared code reduces bundle size by ~70 KB

**Three Component Families**:
1. **UnifiedDialog** - Modal, sheet, and alert dialogs
2. **UnifiedSkeleton** - Text, card, list, and image loading states
3. **UnifiedFormInput** - Text, number, select, checkbox, and radio inputs

---

## UnifiedDialog Component

### Basic Usage

```typescript
import { UnifiedDialog } from '@/components/dialog/unified-dialog';
import { useDialogState } from '@/hooks/dialog/use-dialog-state';

function MyComponent() {
  const { isOpen, open, close } = useDialogState();

  return (
    <>
      <button onClick={open}>Open Dialog</button>

      <UnifiedDialog
        variant="modal"
        open={isOpen}
        onOpenChange={close}
        title="Dialog Title"
        description="Optional description text"
        footer={<button onClick={close}>Close</button>}
      >
        <p>Dialog content goes here.</p>
      </UnifiedDialog>
    </>
  );
}
```

### Variants

#### 1. Modal Variant (Desktop)

```typescript
<UnifiedDialog
  variant="modal"
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Settings"
  size="lg"  // sm, md, lg, xl
  closeOnOverlayClick={true}
  closeOnEscape={true}
>
  <p>Modal content for desktop views.</p>
</UnifiedDialog>
```

#### 2. Sheet Variant (Mobile)

```typescript
<UnifiedDialog
  variant="sheet"
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Filters"
  snapPoints={[0.25, 0.5, 0.9]}  // 25%, 50%, 90% of viewport height
  defaultSnapPoint={1}  // Index of snapPoints (0.5 in this case)
  closeOnDragDown={true}
>
  <p>Bottom sheet content for mobile views.</p>
</UnifiedDialog>
```

#### 3. Alert Variant (Confirmation)

```typescript
<UnifiedDialog
  variant="alert"
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Delete Track?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={async () => {
    await deleteTrack(trackId);
    close();
  }}
  severity="danger"  // danger, warning, info
/>
```

### Responsive: Modal on Desktop, Sheet on Mobile

```typescript
function ResponsiveDialog() {
  const isMobile = useIsMobile();
  const variant: 'modal' | 'sheet' = isMobile ? 'sheet' : 'modal';

  return (
    <UnifiedDialog
      variant={variant}
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Responsive Dialog"
      // Component automatically uses sheet on mobile, modal on desktop
    >
      <p>Content adapts to screen size.</p>
    </UnifiedDialog>
  );
}
```

### Gestures (Mobile)

```typescript
import { useDialogGestures } from '@/hooks/dialog/use-dialog-gesture';

function DialogWithGestures() {
  const gestures = useDialogGestures({
    swipeToClose: true,
    swipeThreshold: 100,  // pixels
    hapticOnStart: true,   // Haptic feedback on swipe start
    hapticOnComplete: true, // Haptic feedback on close
  });

  return (
    <UnifiedDialog
      variant="sheet"
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Swipe to Close"
      {...gestures}
    >
      <p>Swipe down to close this sheet.</p>
    </UnifiedDialog>
  );
}
```

---

## UnifiedSkeleton Component

### Basic Usage

```typescript
import { UnifiedSkeleton } from '@/components/skeleton/unified-skeleton';

function LoadingState() {
  const { isLoading, data } = useQuery({
    queryKey: ['tracks'],
    queryFn: fetchTracks,
  });

  if (isLoading) {
    return <UnifiedSkeleton variant="list" count={5} />;
  }

  return <TrackList tracks={data} />;
}
```

### Variants

#### 1. Text Skeleton

```typescript
<UnifiedSkeleton
  variant="text"
  lines={3}  // Number of shimmer lines
  lineHeight="md"  // sm, md, lg
  lastLineWidth={60}  // Percentage (creates natural look)
/>
```

#### 2. Card Skeleton

```typescript
<UnifiedSkeleton
  variant="card"
  showCover={true}
  coverShape="square"  // square, circle
  lines={3}
  aspectRatio="1:1"  // 1:1, 16:9, 4:3
/>
```

#### 3. List Skeleton

```typescript
<UnifiedSkeleton
  variant="list"
  count={5}  // Number of list items
  layout="vertical"  // horizontal, vertical
  showAvatar={true}
  linesPerItem={2}
/>
```

#### 4. Image Skeleton

```typescript
<UnifiedSkeleton
  variant="image"
  width="100%"
  height={200}
  shape="rounded"  // square, circle, rounded
/>
```

### Animation Control

```typescript
<UnifiedSkeleton
  variant="text"
  lines={3}
  animated={true}  // Enable shimmer animation
  speed="normal"  // slow, normal, fast
/>
```

### Presets

```typescript
import { SKELETON_PRESETS } from '@/components/skeleton/unified-skeleton.config';

// Use predefined presets for common patterns
<UnifiedSkeleton {...SKELETON_PRESETS.trackCard} />
<UnifiedSkeleton {...SKELETON_PRESETS.playlistCard} />
<UnifiedSkeleton {...SKELETON_PRESETS.trackList} />
```

---

## UnifiedFormInput Component

### Basic Usage

```typescript
import { UnifiedFormInput } from '@/components/form/unified-form-input';
import { useFormValidation } from '@/hooks/form/use-form-validation';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

function MyForm() {
  const { methods, handleSubmit, errors } = useFormValidation({
    schema: formSchema,
    defaultValues: { name: '', email: '' },
    onSubmit: async (data) => {
      await submitForm(data);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <UnifiedFormInput
        variant="text"
        name="name"
        label="Name"
        error={errors.name}
        required
      />

      <UnifiedFormInput
        variant="text"
        type="email"
        name="email"
        label="Email"
        error={errors.email}
        required
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Variants

#### 1. Text Input

```typescript
<UnifiedFormInput
  variant="text"
  name="username"
  label="Username"
  type="text"
  placeholder="Enter username"
  maxLength={20}
  autoComplete="username"
  leftIcon={<UserIcon />}
  error={errors.username}
  helperText="Choose a unique username"
  required
/>
```

#### 2. Number Input

```typescript
<UnifiedFormInput
  variant="number"
  name="age"
  label="Age"
  placeholder="Enter age"
  min={18}
  max={100}
  step={1}
  showSteppers={true}  // Show +/- buttons
  error={errors.age}
/>
```

#### 3. Select Input

```typescript
<UnifiedFormInput
  variant="select"
  name="genre"
  label="Genre"
  placeholder="Select a genre"
  options={[
    { label: 'Pop', value: 'pop' },
    { label: 'Rock', value: 'rock' },
    { label: 'Jazz', value: 'jazz' },
  ]}
  searchable={true}  // Enable search/filter
  error={errors.genre}
/>
```

#### 4. Checkbox Input

```typescript
<UnifiedFormInput
  variant="checkbox"
  name="acceptTerms"
  label="I accept the terms and conditions"
  description="Please read before accepting"
  defaultChecked={false}
  error={errors.acceptTerms}
/>
```

#### 5. Radio Input

```typescript
<UnifiedFormInput
  variant="radio"
  name="mood"
  label="Select Mood"
  options={[
    { label: 'Happy', value: 'happy' },
    { label: 'Sad', value: 'sad' },
    { label: 'Energetic', value: 'energetic' },
  ]}
  orientation="vertical"  // horizontal, vertical
  error={errors.mood}
/>
```

### Validation with Zod

```typescript
import { z } from 'zod';

// Define validation schema
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number().min(18, 'Must be 18 or older').max(100, 'Must be 100 or younger'),
});

// Use in component
const { methods, handleSubmit, errors } = useFormValidation({
  schema: formSchema,
  onSubmit: async (data) => {
    console.log('Valid data:', data);
  },
});
```

---

## Migration Guide

### From MobileBottomSheet to UnifiedDialog

**Before (Legacy)**:
```typescript
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet';

<MobileBottomSheet
  isOpen={isOpen}
  onClose={close}
  title="Settings"
>
  <p>Settings content</p>
</MobileBottomSheet>
```

**After (Unified)**:
```typescript
import { UnifiedDialog } from '@/components/dialog/unified-dialog';

<UnifiedDialog
  variant="sheet"
  open={isOpen}
  onOpenChange={close}
  title="Settings"
>
  <p>Settings content</p>
</UnifiedDialog>
```

### From shadcn/ui Dialog to UnifiedDialog

**Before (Legacy)**:
```typescript
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Content</p>
  </DialogContent>
</Dialog>
```

**After (Unified)**:
```typescript
import { UnifiedDialog } from '@/components/dialog/unified-dialog';

<UnifiedDialog
  variant="modal"
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Dialog Title"
>
  <p>Content</p>
</UnifiedDialog>
```

### From shadcn/ui Skeleton to UnifiedSkeleton

**Before (Legacy)**:
```typescript
import { Skeleton } from '@/components/ui/skeleton';

<div>
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
  <Skeleton className="h-4 w-[150px]" />
</div>
```

**After (Unified)**:
```typescript
import { UnifiedSkeleton } from '@/components/skeleton/unified-skeleton';

<UnifiedSkeleton variant="text" lines={3} />
```

### From Custom Form Inputs to UnifiedFormInput

**Before (Legacy)**:
```typescript
<input
  type="email"
  name="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className={errors.email ? 'error' : ''}
/>
{errors.email && <span className="error">{errors.email}</span>}
```

**After (Unified)**:
```typescript
<UnifiedFormInput
  variant="text"
  type="email"
  name="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
/>
```

---

## Common Patterns

### Pattern 1: Form with Dialog

```typescript
function CreatePlaylistDialog() {
  const dialog = useDialogState();
  const { methods, handleSubmit } = useFormValidation({
    schema: playlistSchema,
    onSubmit: async (data) => {
      await createPlaylist(data);
      dialog.close();
    },
  });

  return (
    <>
      <button onClick={dialog.open}>Create Playlist</button>

      <UnifiedDialog
        variant="sheet"
        open={dialog.isOpen}
        onOpenChange={dialog.close}
        title="Create Playlist"
        footer={
          <button onClick={methods.handleSubmit(handleSubmit)}>
            Create
          </button>
        }
      >
        <UnifiedFormInput
          variant="text"
          name="name"
          label="Playlist Name"
          control={methods.control}
          error={methods.formState.errors.name}
          required
        />
      </UnifiedDialog>
    </>
  );
}
```

### Pattern 2: Loading State with Skeleton

```typescript
function TrackListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tracks'],
    queryFn: fetchTracks,
  });

  if (isLoading) {
    return <UnifiedSkeleton variant="list" count={10} />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return <TrackList tracks={data} />;
}
```

### Pattern 3: Confirmation Alert

```typescript
function DeleteTrackButton({ trackId }: { trackId: string }) {
  const dialog = useDialogState();

  const handleDelete = async () => {
    await deleteTrack(trackId);
    dialog.close();
  };

  return (
    <>
      <button onClick={dialog.open}>Delete Track</button>

      <UnifiedDialog
        variant="alert"
        open={dialog.isOpen}
        onOpenChange={dialog.close}
        title="Delete Track?"
        description="This action cannot be undone. All versions will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        severity="danger"
      />
    </>
  );
}
```

### Pattern 4: Responsive Dialog (Mobile Sheet, Desktop Modal)

```typescript
function ResponsiveSettingsDialog() {
  const dialog = useDialogState();
  const isMobile = useIsMobile();

  return (
    <UnifiedDialog
      variant={isMobile ? 'sheet' : 'modal'}
      open={dialog.isOpen}
      onOpenChange={dialog.close}
      title="Settings"
      // Mobile: sheet with snap points, Desktop: modal with size
      {...(isMobile && {
        snapPoints: [0.5, 0.9],
        defaultSnapPoint: 0,
      } as any)}
      {...(!isMobile && {
        size: 'lg',
      } as any)}
    >
      <SettingsContent />
    </UnifiedDialog>
  );
}
```

---

## Troubleshooting

### Issue: TypeScript Error - Property 'variant' does not exist

**Cause**: Using discriminated union without specifying variant

**Solution**: Always specify the `variant` prop explicitly

```typescript
// ❌ Wrong - TypeScript error
<UnifiedDialog open={isOpen} onOpenChange={close} title="Title" />

// ✅ Correct - Specify variant
<UnifiedDialog variant="modal" open={isOpen} onOpenChange={close} title="Title" />
```

### Issue: Sheet Not Closing on Swipe

**Cause**: `closeOnDragDown` not enabled

**Solution**: Enable swipe-to-close gesture

```typescript
<UnifiedDialog
  variant="sheet"
  open={isOpen}
  onOpenChange={close}
  title="Swipe to Close"
  closeOnDragDown={true}  // Enable swipe-to-close
/>
```

### Issue: Form Validation Not Working

**Cause**: Forgetting to pass `control` prop from React Hook Form

**Solution**: Pass `control` prop to form inputs

```typescript
const { methods } = useFormValidation({ schema, onSubmit });

// ❌ Wrong - Missing control prop
<UnifiedFormInput variant="text" name="email" />

// ✅ Correct - Pass control prop
<UnifiedFormInput
  variant="text"
  name="email"
  control={methods.control}
/>
```

### Issue: Skeleton Animation Not Playing

**Cause**: `animated` prop set to `false` or CSS not loaded

**Solution**: Ensure `animated={true}` (default) and CSS is imported

```typescript
// ✅ Default - Animation enabled
<UnifiedSkeleton variant="text" lines={3} />

// ✅ Explicit - Animation enabled
<UnifiedSkeleton variant="text" lines={3} animated={true} />

// ❌ Animation disabled
<UnifiedSkeleton variant="text" lines={3} animated={false} />
```

---

## FAQ

### Q: Should I use modal or sheet variant?

**A**: Use `sheet` on mobile, `modal` on desktop. The component supports responsive behavior:

```typescript
const variant = isMobile() ? 'sheet' : 'modal';
```

For Telegram Mini App (95% mobile users), `sheet` is the default recommended variant.

### Q: Can I use UnifiedDialog without the state hook?

**A**: Yes, the component works with any boolean state:

```typescript
const [isOpen, setIsOpen] = useState(false);

<UnifiedDialog
  variant="modal"
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Title"
>
  Content
</UnifiedDialog>
```

### Q: How do I customize dialog content?

**A**: Use the `children` prop for custom content, or `footer` prop for custom footer:

```typescript
<UnifiedDialog
  variant="modal"
  open={isOpen}
  onOpenChange={close}
  title="Custom Dialog"
  footer={<CustomFooterButtons />}
>
  <CustomDialogContent />
</UnifiedDialog>
```

### Q: Can I use UnifiedFormInput without React Hook Form?

**A**: Yes, use as controlled components:

```typescript
const [value, setValue] = useState('');

<UnifiedFormInput
  variant="text"
  name="fieldName"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Q: How do I add custom validation?

**A**: Use Zod schema with custom validators:

```typescript
const schema = z.object({
  username: z.string()
    .min(3, 'Too short')
    .refine(async (val) => {
      const exists = await checkUsernameExists(val);
      return !exists;
    }, 'Username already taken'),
});
```

### Q: What's the performance impact of unified components?

**A**: Positive impact! Consolidation reduces bundle size by ~70 KB through code sharing. Components are lazy-loaded and tree-shakeable.

### Q: Can I use unified components in existing pages?

**A**: Yes! Unified components are backward compatible. Migrate gradually at your own pace. Legacy components remain functional during transition.

---

## Next Steps

1. **Explore Examples**: Check `src/components/track/track-card.tsx` for reference implementation (Feature 001)
2. **Read Type Definitions**: Review `contracts/*.types.ts` files for detailed API documentation
3. **Practice Migration**: Start with low-risk pages (About, Help) before migrating critical flows
4. **Provide Feedback**: Report issues or suggest improvements via GitHub issues

---

**Need Help?**

- Check the [troubleshooting section](#troubleshooting) for common issues
- Review [type definitions](./contracts/) for detailed API docs
- Reference [Feature 001 implementation](../../src/components/track/track-card.tsx) for patterns
- Ask in team chat or create a GitHub issue

**Happy Coding!** 🎵
