# Audio Upload System Fixes - 2025-12-12

## Problem Statement

The user reported several issues with the audio upload system (in Russian):

1. Cover and extend functions not working
2. After upload, a new window opens instead of integrated form
3. V5 model should have 240-second limit (not 480s)
4. Missing automatic style analysis via audio-flamingo-3
5. Missing lyrics extraction from audio
6. Storage error with special characters in filenames (e.g., ✡️)

## Issues Fixed

### 1. Filename Sanitization (Critical)

**Problem**: Storage API failing with error: `Invalid key: 674a8a18-bf9e-4434-83c1-8f9aad2e5c33/uploads/1765559620417-✡️Супер-жид✡️.mp3`

**Solution**:
- Created `sanitizeFilename` utility in both client and server
- Removes special characters, emoji, and non-ASCII characters
- Applied to `suno-upload-cover` and `suno-upload-extend` edge functions

**Files Modified**:
- `src/lib/sanitizeFilename.ts` (new)
- `supabase/functions/_shared/sanitize-filename.ts` (new)
- `supabase/functions/suno-upload-cover/index.ts`
- `supabase/functions/suno-upload-extend/index.ts`

### 2. V5 Model Duration Limit

**Problem**: V5 model incorrectly allowed 480 seconds (8 minutes) instead of 240 seconds (4 minutes)

**Solution**:
- Updated `MODEL_DURATION_LIMITS` constant to set V5 to 240 seconds
- Applied on both client and server side

**Files Modified**:
- `src/components/UploadAudioDialog.tsx` - line 342
- `supabase/functions/suno-upload-cover/index.ts` - line 224
- `supabase/functions/suno-upload-extend/index.ts` - line 229

### 3. Automatic Audio Analysis

**Problem**: No automatic style analysis or lyrics extraction after audio upload

**Solution**:
- Integrated `analyze-audio-flamingo` function for style detection
- Integrated `transcribe-lyrics` function for lyrics extraction
- Runs both in parallel using `Promise.allSettled`
- Auto-populates style and lyrics fields
- Shows loading indicator during analysis
- Marks tracks as instrumental if no vocals detected

**Implementation Details**:
```typescript
const analyzeAudioFile = async (file: File) => {
  // Upload temporary file
  // Run parallel analysis:
  // 1. audio-flamingo-3 for style
  // 2. transcribe-lyrics for lyrics
  // Auto-populate fields with results
}
```

**Files Modified**:
- `src/components/UploadAudioDialog.tsx` - added `analyzeAudioFile` function
- Added `isAnalyzing` and `analysisComplete` state
- Added UI indicators for analysis progress

### 4. Inline Cover/Extend Integration

**Problem**: Cover and extend opened a separate dialog, confusing UX

**Solution**:
- Added "Кавер" and "Расширение" buttons directly in `GenerateFormActions`
- Removed `AudioUploadActionDialog` separate flow
- Click on cover/extend now opens `UploadAudioDialog` inline with appropriate mode
- Simplified user flow from 3 steps to 1 step

**Files Modified**:
- `src/components/generate-form/GenerateFormActions.tsx` - added cover/extend buttons
- `src/components/GenerateSheet.tsx` - integrated direct dialog opening

## Technical Architecture

### Audio Analysis Flow

```
User uploads audio file
        ↓
UploadAudioDialog.handleFileSelect
        ↓
analyzeAudioFile (automatic)
        ↓
    ┌───┴───┐
    ↓       ↓
Flamingo-3  Transcribe
(style)     (lyrics)
    ↓       ↓
Auto-populate fields
```

### Cover/Extend Flow (New)

```
User clicks "Кавер" or "Расширение"
        ↓
UploadAudioDialog opens with mode preset
        ↓
User selects audio file
        ↓
Automatic analysis runs
        ↓
Fields auto-populated
        ↓
User submits
```

## Performance Impact

- **Parallel Analysis**: Style and lyrics analysis run concurrently, not sequentially
- **Temporary Storage**: Analysis files stored temporarily and cleaned up after
- **Error Handling**: Graceful fallback if analysis fails - users can fill manually
- **Loading States**: Clear UI feedback during analysis (spinner + progress text)

## User Experience Improvements

1. **Simplified Flow**: From multi-step dialog to single integrated form
2. **Automatic Data**: No manual style/lyrics entry needed for covers
3. **Clear Feedback**: Analysis progress shown with visual indicators
4. **Error Recovery**: Analysis failures don't block submission
5. **Mobile Friendly**: Inline form works better on mobile than separate dialogs

## Testing Recommendations

### 1. Filename Sanitization
- Upload file with emoji in name: `✡️test.mp3`
- Upload file with Cyrillic: `тест.mp3`
- Upload file with special chars: `file@#$%.mp3`

### 2. V5 Duration Validation
- Upload 3-minute audio with V5 model: ✅ Should work
- Upload 5-minute audio with V5 model: ❌ Should show error
- Verify error message suggests appropriate model

### 3. Audio Analysis
- Upload instrumental track: Should mark as instrumental
- Upload vocal track: Should extract lyrics and populate field
- Upload various genres: Should auto-detect style
- Test error handling: Disconnect network during analysis

### 4. Cover/Extend Integration
- Click "Кавер" button: Should open UploadAudioDialog in cover mode
- Click "Расширение" button: Should open UploadAudioDialog in extend mode
- Verify no separate dialog opens
- Check mobile experience

## Known Limitations

1. **Analysis Time**: Audio analysis can take 30-60 seconds for long files
2. **Replicate API**: Requires REPLICATE_API_KEY to be configured
3. **Temporary Storage**: Uses project-assets bucket for temp analysis files
4. **Language Detection**: Lyrics transcription best for English, may vary for other languages

## Future Improvements

1. **Progress Bar**: Show detailed progress during analysis steps
2. **Manual Retrigger**: Button to re-run analysis if results unsatisfactory
3. **Style Enhancement**: Use audio-flamingo-3 thinking mode for better style descriptions
4. **Caching**: Cache analysis results to avoid re-analyzing same files
5. **Batch Analysis**: Allow analyzing multiple uploaded files

## Related Documentation

- [Audio Upload Flow](./AUDIO_UPLOAD_FLOW.md)
- [Audio Upload Improvements](./AUDIO_UPLOAD_IMPROVEMENTS_SUMMARY.md)
- [Cover/Extend System Audit](./COVER_EXTEND_SYSTEM_AUDIT.md)

## Deployment Notes

- No database migrations required
- Edge function changes deploy automatically
- Client changes require build deployment
- Backward compatible - existing flows unaffected

## Monitoring

Watch for these metrics after deployment:
- `analyze-audio-flamingo` function invocations
- `transcribe-lyrics` function invocations
- Storage upload success rate
- Cover/extend completion rate
- User feedback on automatic analysis

## Rollback Plan

If issues arise:
1. Revert to commit `3a47e48` (before these changes)
2. Old AudioUploadActionDialog flow will be restored
3. Manual style/lyrics entry will be required again
4. V5 limit will revert to 480s (incorrect but functional)
