# Code Cleanup Priorities

**Generated:** 2025-12-17

## High Priority TODOs (Blocking Features)

### 1. Track Versions Context (T048)
**File:** `src/components/TrackDetailSheet.tsx`
```
- Add version context support
- Allow switching between versions
- Update tabs based on selected version
```

### 2. Trending/Popular Algorithms
**File:** `src/integrations/supabase/queries/public-content.ts`
```
- Implement trending algorithm using trending_score
- Order popular by play_count
```

### 3. Report Functionality
**File:** `src/components/comments/CommentsList.tsx`
```
- Implement comment reporting
```

## Medium Priority (Nice to Have)

### 4. Klangio Tools Integration
**File:** `src/components/studio/KlangioToolsPanel.tsx`
```
- Connect to actual Klangio API
- Implement real chord detection
- Implement real beat detection
- Implement stem separation
```

### 5. Track Cleanup on Delete
**File:** `src/services/tracks.service.ts`
```
- Clean storage files on track deletion
- Clean versions, stems
```

### 6. Error Tracking
**File:** `src/lib/errors.ts`
```
- Integrate Sentry or similar
```

## Low Priority (Future Enhancement)

### 7. Generation History Database
**File:** `src/contexts/AIAssistantContext.tsx`
```
- Create user_generation_history table
- Persist history to database
```

### 8. Multi-Track File Upload
**File:** `src/components/studio/MultiTrackStudioLayout.tsx`
```
- Implement audio file upload for multi-track
```

## Completed / Can Be Removed
- Guitar analysis placeholder (needs real implementation or removal)

## Code Quality Issues Found
1. Some components still import from 'date-fns' directly instead of '@/lib/date-utils'
2. Some direct framer-motion usage detected in older files (should use '@/lib/motion')

## Recommended Actions
1. Fix trending/popular queries - **Easy, High Impact**
2. Implement comment reporting - **Medium, User Safety**
3. Connect Klangio tools - **Complex, Professional Feature**
4. Add Sentry integration - **Easy, Ops Quality**
