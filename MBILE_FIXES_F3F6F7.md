# Mobile Fixes F3/F6/F7 - Implementation Plan

## F6: Master Volume Snap Fix

**File:** `src/components/studio/unified/StudioShell.tsx`

**Current Problem (Lines 495, 587):**

```tsx
onClick={() => setMasterVolume(project.masterVolume === 0 ? 0.85 : 0)}
onMasterMuteToggle={() => setMasterVolume(project.masterVolume === 0 ? 0.85 : 0)}
```

**Issue:** Always snaps to 0.85 on unmute, ignores previous non-zero value

**Solution:** Add local state to remember previous volume

```tsx
// Add after line 56 (existing imports)
const [previousMasterVolume, setPreviousMasterVolume] = useState(0.85);

// Update line 495
onClick={() => {
  if (project.masterVolume === 0) {
    setMasterVolume(previousMasterVolume); // Restore previous volume
  } else {
    setPreviousMasterVolume(project.masterVolume); // Save current volume
    setMasterVolume(0); // Mute
  }
}

// Update line 587
onMasterMuteToggle={() => {
  if (project.masterVolume === 0) {
    setMasterVolume(previousMasterVolume);
  } else {
    setPreviousMasterVolume(project.masterVolume);
    setMasterVolume(0);
  }
}}
```

**Import needed:** Add `useState` to React imports (line 38)

---

## F7: Notes Undefined Fix

**File:** `src/pages/lyrics-studio/LyricsStudioPage.tsx`

**Current Problem (Lines 479, 522):**

```tsx
// Line 479
notes: undefined,  // ❌ Should pass actual notes
// Line 522
existingNote={null}  // ❌ Always overwrites existing notes
```

**Solution 1 - Fix notes undefined:**

```tsx
// Line 479 - Pass actual section notes
notes: selectedSection?.notes || "",
```

**Solution 2 - Fix existingNote null:**

```tsx
// Find the actual note for the selected section
const getExistingNoteForSection = useCallback((sectionId: string) => {
  const sectionNote = sectionNotes?.find(n => n.section_type === sectionId);
  return sectionNote?.notes || "";
}, [sectionNotes]);

// Line 522 - Use actual note
existingNote={getExistingNoteForSection(selectedSection?.id)}
```

---

## F3: Keyboard Navigation Fix

**File:** `src/components/library/VirtualizedTrackList.tsx`

**Current Problem:** No `aria-selected` on selected track, no `scroll-into-view` on keyboard navigation

**Solution:**

```tsx
// Add to TrackRow/TrackCard component (wherever track is rendered)
import { useLayoutEffect, useRef } from "react";

const TrackItem = ({ track, isSelected, onSelect }) => {
  const itemRef = useRef<HTMLDivElement>(null);

  // Scroll into view when selected via keyboard
  useLayoutEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isSelected]);

  return (
    <div
      ref={itemRef}
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(track)}
      // ... rest of component
    />
  );
};
```

---

## Execution Order

1. **F6 First** (10 min) - Low risk, clear fix
2. **F7 Second** (20 min) - Medium risk, need to understand notes flow
3. **F3 Last** (30 min) - Needs component structure analysis

## Testing

After fixes:

1. Open Library → test Arrow keys navigation
2. Open Studio → test mute/unmute with different volumes
3. Open Lyrics Studio → check AI agent gets proper notes

---

**Estimate:** 1 hour total  
**Risk:** Low (isolated changes, well-tested patterns)
