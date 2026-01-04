# Audio Playback Fix - December 10, 2025

## Проблема (Problem)

**Русский:** Плеер запускался, воспроизведение шло, но не было звука. Волна не генерировалась.

**English:** Player started, playback progressed, but there was no sound. Waveform was not generated.

## Root Cause

The issue was introduced in PR #119 which added `GlobalAudioProvider` and refactored audio visualization. Two critical bugs were present:

### Bug 1: Early Returns Before Connection Check

In `src/hooks/audio/useAudioVisualizer.ts` (lines 78-128 before fix):

```typescript
// OLD CODE - BUGGY
async function getOrCreateAudioNodes(...) {
  // Create or get AudioContext
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  
  // Try to resume
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
    // If failed:
    return null; // ❌ EARLY RETURN!
  }
  
  // Check if running
  if (audioContext.state !== 'running') {
    return null; // ❌ EARLY RETURN!
  }
  
  // Check existing connection (NEVER REACHED!)
  if (connectedAudioElement === audioElement && globalSourceNode) {
    return globalAnalyser;
  }
  
  // Create new connection...
}
```

**Problem:** If AudioContext was suspended and resume failed, the function returned null. BUT if `globalSourceNode` was already created in a previous call, the audio element is **still disconnected from default output** and routed through Web Audio API. Without reaching the connection check, the audio remained disconnected = silence.

### Bug 2: Un-awaited AudioContext.resume()

In `src/components/player/AudioVisualizer.tsx` (line 56 before fix):

```typescript
// OLD CODE - BUGGY
if (audioContext.state === 'suspended') {
  audioContext.resume(); // ❌ NOT AWAITED!
}

// Immediately create source (context still suspended!)
mediaSource = audioContext.createMediaElementSource(audioElement);
```

**Problem:** `resume()` returns a Promise but wasn't awaited. The code immediately continued to create `MediaElementSource` while the context was still suspended, creating a race condition resulting in silent playback.

## Solution

### Fix 1: Check Connections First

```typescript
// NEW CODE - FIXED
async function getOrCreateAudioNodes(...) {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  
  // ✅ CHECK EXISTING CONNECTION FIRST!
  if (connectedAudioElement === audioElement && globalSourceNode && globalAnalyserNode) {
    // Ensure destination connection maintained
    try {
      globalAnalyserNode.connect(audioContext.destination);
    } catch (err) {
      // May already be connected (InvalidStateError) - OK
    }
    
    // Try to resume if suspended
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (err) {
        // Resume failed but connection maintained!
      }
    }
    
    return globalAnalyserNode;
  }
  
  // Now check state and return null if needed
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
    if (failed) {
      // ✅ BUT ensure existing source is connected!
      if (globalSourceNode) {
        globalSourceNode.disconnect();
        globalSourceNode.connect(audioContext.destination);
      }
      return null;
    }
  }
  
  // Rest of initialization...
}
```

### Fix 2: Await Resume

```typescript
// NEW CODE - FIXED
if (audioContext.state === 'suspended') {
  try {
    await audioContext.resume(); // ✅ AWAITED!
    logger.debug('AudioContext resumed', { state: audioContext.state });
  } catch (err) {
    logger.error('Failed to resume', err);
    // ✅ Reconnect if source exists
    if (mediaSource && connectedAudioElement === audioElement) {
      mediaSource.disconnect();
      mediaSource.connect(audioContext.destination);
      return sharedAnalyser;
    }
    return null;
  }
}

// Only create source after context is confirmed running
mediaSource = audioContext.createMediaElementSource(audioElement);
```

## Why This Matters

### Web Audio API Behavior

When `audioContext.createMediaElementSource(audioElement)` is called:

1. **Audio element is IMMEDIATELY disconnected from default output**
2. Audio will **ONLY** play through Web Audio API routing
3. Source MUST be connected to `audioContext.destination` for sound
4. This is permanent - can only call `createMediaElementSource` once per element

### The Race Condition

**Timeline of the bug:**

1. User plays track → AudioContext created (suspended by autoplay policy)
2. `getOrCreateAudioNodes` called → creates MediaElementSource → connects to destination
3. User pauses/resumes → AudioContext might suspend again (browser policy)
4. `getOrCreateAudioNodes` called again → checks state → suspended
5. Tries resume → fails or takes time
6. **Returns null before checking existing connection**
7. Audio still routed through Web Audio API but connection check never reached
8. Audio element disconnected from destination
9. **Result: Playback continues but no sound!**

### The Fix

**New timeline:**

1. User plays track → AudioContext created (suspended)
2. `getOrCreateAudioNodes` called → creates MediaElementSource → connects
3. User pauses/resumes → AudioContext suspended
4. `getOrCreateAudioNodes` called again → **FIRST checks existing connection**
5. **Ensures destination connection maintained**
6. Tries resume → even if fails, connection already secured
7. **Result: Audio continues playing!**

## Files Changed

- `src/hooks/audio/useAudioVisualizer.ts` - Main fix for audio routing
- `src/components/player/AudioVisualizer.tsx` - Await resume + reconnection logic

## Testing

- ✅ Build successful (no TypeScript errors)
- ✅ CodeQL scan passed (0 security alerts)
- ✅ Code review completed
- ⚠️ Manual testing pending (requires deployed environment)

## Key Takeaways

1. **Always check existing Web Audio connections BEFORE early returns**
2. **Always await `audioContext.resume()`** - never call without await
3. **When resume fails, check if source exists and reconnect to destination**
4. **createMediaElementSource disconnects audio immediately** - ensure destination connection maintained
5. **Add comprehensive logging** for debugging audio issues in production

## References

- Web Audio API Spec: https://www.w3.org/TR/webaudio/
- Autoplay Policy: https://developer.chrome.com/blog/autoplay/
- MediaElementAudioSourceNode: https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode

---

**Fixed by:** GitHub Copilot Agent  
**Date:** December 10, 2025  
**Branch:** `copilot/fix-music-player-sound-issue`  
**Commits:** bd9b57b, 87436eb
