# Music Player Troubleshooting Guide

## Quick Diagnostics

If you're experiencing issues with the music player, follow these steps:

1. **Check browser console** for error messages
2. **Verify network connection** (check Network tab in DevTools)
3. **Test with different audio sources** (streaming vs local)
4. **Clear browser cache and localStorage**
5. **Try a different browser** to isolate browser-specific issues

## Common Issues

### Audio Playback Issues

#### Problem: Audio won't play at all

**Symptoms:**
- Play button does nothing
- Loading spinner appears indefinitely
- No sound output

**Possible Causes & Solutions:**

1. **Browser Autoplay Policy**
   - **Cause**: Modern browsers block autoplay without user interaction
   - **Solution**: Ensure playback is triggered by user action (click, tap)
   - **Code Check**: Verify `play()` is called after user interaction
   ```typescript
   // ✅ Good - triggered by user click
   <Button onClick={() => play()}>Play</Button>
   
   // ❌ Bad - autoplay on page load
   useEffect(() => { play(); }, []);
   ```

2. **Invalid Audio URL**
   - **Cause**: URL is null, undefined, or points to non-existent file
   - **Solution**: Verify track has valid audio_url, streaming_url, or local_audio_url
   - **Debug**: Check network tab for 404 or CORS errors
   ```typescript
   // Check in useAudioPlayer
   console.log('Audio sources:', { streamingUrl, localAudioUrl, audioUrl });
   ```

3. **CORS Issues**
   - **Cause**: Audio served from different domain without CORS headers
   - **Solution**: 
     - Configure server to send proper CORS headers
     - Use proxy or same-origin URLs
   - **Headers needed**:
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: GET
     ```

4. **Network Connectivity**
   - **Cause**: No internet connection or server down
   - **Solution**: Check network connection, try local fallback
   - **Debug**: Open Network tab, filter by media files

5. **Audio Format Not Supported**
   - **Cause**: Browser doesn't support audio codec/format
   - **Solution**: Convert audio to widely supported format (MP3, AAC)
   - **Check Support**:
     ```javascript
     const audio = new Audio();
     console.log('MP3:', audio.canPlayType('audio/mpeg'));
     console.log('OGG:', audio.canPlayType('audio/ogg'));
     ```

#### Problem: Audio plays but no sound

**Symptoms:**
- Progress bar moves
- isPlaying is true
- No audio output

**Solutions:**

1. **Check Volume Settings**
   - Verify volume slider not at 0
   - Check mute state
   - Check system volume
   - Check browser tab audio indicator

2. **Audio Element Volume**
   ```typescript
   // Debug audio element volume
   console.log('Audio volume:', audioRef.current?.volume);
   console.log('Audio muted:', audioRef.current?.muted);
   ```

3. **Audio Output Device**
   - Check correct output device selected (headphones, speakers)
   - Test with other applications
   - Restart audio drivers if needed

#### Problem: Audio stutters or buffers frequently

**Symptoms:**
- Playback keeps pausing
- Loading indicator appears intermittently
- Poor audio quality

**Solutions:**

1. **Slow Network Connection**
   - **Solution**: 
     - Use lower quality streaming URL
     - Enable local caching
     - Preload content
   - **Debug**:
     ```typescript
     // Check buffer progress
     console.log('Buffered:', buffered, '%');
     ```

2. **Large File Size**
   - **Solution**: Use streaming URLs instead of downloading entire file
   - **Check**: Verify streaming_url is being used first

3. **Server Issues**
   - **Solution**: 
     - Check server load
     - Use CDN for audio delivery
     - Implement rate limiting

4. **Browser Tab Throttling**
   - **Cause**: Inactive tabs have reduced performance
   - **Solution**: Keep tab active or use Media Session API

### Queue Management Issues

#### Problem: Queue not persisting after refresh

**Symptoms:**
- Queue clears on page reload
- Previously played tracks forgotten

**Solutions:**

1. **localStorage Disabled**
   - **Cause**: Private/incognito mode or browser settings
   - **Solution**: Enable localStorage or use session-only mode
   - **Check**:
     ```javascript
     try {
       localStorage.setItem('test', 'test');
       localStorage.removeItem('test');
       console.log('localStorage available');
     } catch (e) {
       console.error('localStorage unavailable:', e);
     }
     ```

2. **Storage Quota Exceeded**
   - **Cause**: Too much data stored (>5MB typically)
   - **Solution**: 
     - Clear old data
     - Reduce queue size
     - Implement cleanup strategy
   - **Debug**:
     ```javascript
     console.log('Queue size:', 
       JSON.stringify(queue).length / 1024, 'KB');
     ```

3. **Corrupted Storage Data**
   - **Cause**: Invalid JSON or schema mismatch
   - **Solution**: Clear localStorage and start fresh
   ```javascript
   localStorage.removeItem('musicverse-playback-queue');
   localStorage.removeItem('musicverse-queue-state');
   ```

4. **Storage Key Mismatch**
   - **Cause**: Key changed between versions
   - **Solution**: Implement migration logic
   - **Check**: Verify correct storage keys in code

#### Problem: Queue reordering not working

**Symptoms:**
- Drag-and-drop doesn't move tracks
- Queue order unchanged after drag

**Solutions:**

1. **Touch Events Not Working**
   - **Solution**: Ensure @dnd-kit configured for touch
   - **Check**: PointerSensor activation constraint set

2. **State Not Updating**
   - **Debug**:
     ```typescript
     console.log('Queue before:', queue);
     reorderQueue(oldIndex, newIndex);
     console.log('Queue after:', queue);
     ```

3. **Index Calculation Error**
   - **Check**: Verify currentIndex updated correctly
   - **Test**: Add console logs in reorderQueue logic

### Player UI Issues

#### Problem: Player mode not changing

**Symptoms:**
- Player stuck in one mode
- Expand/minimize buttons don't work

**Solutions:**

1. **State Update Not Triggering**
   - **Debug**:
     ```typescript
     console.log('Current mode:', playerMode);
     expandPlayer();
     console.log('After expand:', playerMode);
     ```

2. **CSS Classes Not Applied**
   - **Check**: Inspect element for correct classes
   - **Verify**: Conditional rendering logic

3. **Z-index Issues**
   - **Solution**: Check z-index values in CSS
   - **Hierarchy**: fullscreen > expanded > compact

#### Problem: Progress bar seek not working

**Symptoms:**
- Clicking/dragging doesn't change position
- Time doesn't update

**Solutions:**

1. **Duration Not Loaded**
   - **Cause**: Metadata not yet loaded
   - **Solution**: Disable seek until loadedmetadata event
   - **Check**:
     ```typescript
     console.log('Duration:', duration);
     console.log('Can seek:', duration > 0);
     ```

2. **Pointer Events Not Captured**
   - **Check**: Verify pointer event handlers attached
   - **Debug**: Add console.log in event handlers

3. **Time Calculation Error**
   - **Verify**: Progress bar width calculation
   - **Test**: Log calculated time vs actual time

### Performance Issues

#### Problem: Player UI laggy or unresponsive

**Symptoms:**
- Buttons respond slowly
- Animations stuttering
- High CPU usage

**Solutions:**

1. **Too Many Re-renders**
   - **Solution**: 
     - Use React.memo for components
     - useCallback for event handlers
     - Optimize state updates
   - **Debug**: Use React DevTools Profiler

2. **Heavy Components**
   - **Solution**: 
     - Lazy load player components
     - Code split large features
     - Virtual scrolling for queues

3. **Event Listener Overhead**
   - **Solution**: Debounce rapid events (timeupdate, progress)
   - **Example**:
     ```typescript
     const debouncedTimeUpdate = useMemo(
       () => debounce((time) => setCurrentTime(time), 100),
       []
     );
     ```

4. **Large Queue**
   - **Solution**: 
     - Virtual scrolling
     - Pagination
     - Lazy render queue items

#### Problem: Memory leaks

**Symptoms:**
- Memory usage grows over time
- Browser becomes slow after extended use

**Solutions:**

1. **Audio Elements Not Cleaned Up**
   - **Check**: Verify cleanup in useEffect
   ```typescript
   useEffect(() => {
     return () => {
       if (audioRef.current) {
         audioRef.current.pause();
         audioRef.current.src = '';
         audioRef.current = null;
       }
     };
   }, []);
   ```

2. **Event Listeners Not Removed**
   - **Verify**: All addEventListener have removeEventListener
   - **Pattern**: Use cleanup function in useEffect

3. **State Subscriptions**
   - **Check**: Zustand subscriptions cleaned up
   - **Solution**: Use proper React hooks integration

## Browser-Specific Issues

### Chrome/Edge
- **Issue**: Autoplay blocked on mobile
- **Solution**: Use Media Session API
- **Issue**: High memory usage with multiple tabs
- **Solution**: Implement tab visibility handling

### Firefox
- **Issue**: Different audio format support
- **Solution**: Provide multiple format options
- **Issue**: CORS handling stricter
- **Solution**: Ensure proper CORS headers

### Safari (iOS/macOS)
- **Issue**: Inline playback restrictions
- **Solution**: Set `playsinline` attribute
- **Issue**: Audio playback in background limited
- **Solution**: Use native app wrapper
- **Issue**: Touch events behave differently
- **Solution**: Test thoroughly on actual devices

### Mobile Browsers
- **Issue**: Background playback stops
- **Solution**: Implement Media Session API
- **Issue**: Data saver mode affects streaming
- **Solution**: Provide low-quality option
- **Issue**: Battery optimization kills player
- **Solution**: Use native wrappers (Telegram Mini App)

## Debugging Tools

### Browser DevTools

1. **Console**
   - Enable verbose logging
   - Watch for errors and warnings
   - Use console.log for state inspection

2. **Network Tab**
   - Monitor audio file requests
   - Check response codes
   - Verify headers (CORS, content-type)
   - Monitor bandwidth usage

3. **Application Tab**
   - Check localStorage data
   - Verify storage quota
   - Inspect stored queue data

4. **Performance Tab**
   - Profile player performance
   - Identify bottlenecks
   - Monitor memory usage

### React DevTools

1. **Components**
   - Inspect component props/state
   - Check render counts
   - Verify hooks values

2. **Profiler**
   - Identify slow components
   - Find unnecessary re-renders
   - Optimize render performance

### Custom Debugging

Add debug mode to player:

```typescript
// In .env or config
const DEBUG_PLAYER = import.meta.env.VITE_DEBUG_PLAYER === 'true';

// In useAudioPlayer
if (DEBUG_PLAYER) {
  console.log('[Player]', {
    trackId,
    audioSource,
    isPlaying,
    currentTime,
    duration,
    buffered
  });
}
```

## Performance Monitoring

### Key Metrics

1. **Time to First Audio** (TFA)
   - Time from play button to audio start
   - Target: < 500ms

2. **Buffer Health**
   - Percentage of track buffered ahead
   - Target: > 30% ahead of playback

3. **Seek Latency**
   - Time from seek to playback resume
   - Target: < 200ms

4. **Memory Usage**
   - RAM consumed by player
   - Target: < 50MB per tab

5. **CPU Usage**
   - Processor utilization
   - Target: < 5% idle, < 20% playing

### Monitoring Tools

```typescript
// Add performance markers
performance.mark('audio-play-start');
await audio.play();
performance.mark('audio-play-end');
performance.measure('audio-play', 'audio-play-start', 'audio-play-end');

// Get measurements
const measures = performance.getEntriesByType('measure');
console.log('Play latency:', measures[0].duration);
```

## Getting Help

If issues persist after troubleshooting:

1. **Check GitHub Issues**: Search for similar problems
2. **Create New Issue**: Provide:
   - Browser and version
   - Operating system
   - Steps to reproduce
   - Console errors
   - Network logs
   - Expected vs actual behavior
3. **Community Support**: Ask in project discussions
4. **Documentation**: Review architecture docs

## Preventive Measures

### Best Practices

1. **Error Boundaries**
   - Wrap player in React error boundary
   - Graceful degradation on errors

2. **Timeout Handling**
   - Set timeouts for loading operations
   - Fallback to alternative sources

3. **User Feedback**
   - Show loading states
   - Display error messages
   - Provide retry options

4. **Testing**
   - Test across browsers
   - Test on actual devices
   - Test different network conditions
   - Test with various audio formats

5. **Monitoring**
   - Implement error tracking (Sentry)
   - Monitor performance metrics
   - Track user behavior
   - Log playback failures

## Useful Commands

```bash
# Clear all storage
localStorage.clear();

# Check storage usage
navigator.storage.estimate().then(estimate => {
  console.log('Usage:', estimate.usage, 'bytes');
  console.log('Quota:', estimate.quota, 'bytes');
});

# Test audio formats
const audio = new Audio();
['mp3', 'ogg', 'wav', 'aac'].forEach(format => {
  console.log(format, ':', audio.canPlayType(`audio/${format}`));
});

# Monitor network quality
navigator.connection?.addEventListener('change', () => {
  console.log('Network changed:', {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink
  });
});
```

## Related Documentation

- [Player Architecture](./PLAYER_ARCHITECTURE.md)
- [API Reference](../src/hooks/)
- [Contributing Guide](../CONTRIBUTING.md)
