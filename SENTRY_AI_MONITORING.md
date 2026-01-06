# Sentry AI Monitoring Integration Guide

This guide shows how to use the custom AI monitoring instrumentation for Suno music generation in your MusicVerse AI project.

## Quick Start

Import the AI monitoring functions in your hooks or services:

```typescript
import {
  trackSimpleGeneration,
  trackCustomGeneration,
  trackStemSeparation,
  trackAudioExtension,
  trackVocalsGeneration,
  trackInstrumentalGeneration,
  trackSectionRegeneration,
  trackSunoAgent,
  trackSunoTool,
} from '@/lib/sentryAI';
```

## Usage Examples

### 1. Simple Music Generation

```typescript
import { trackSimpleGeneration } from '@/lib/sentryAI';

async function generateSimpleTrack(
  prompt: string,
  model: string,
  instrumental: boolean
) {
  return await trackSimpleGeneration(
    model as 'V5' | 'V4_5',
    prompt,
    instrumental,
    async () => {
      // Your actual Suno API call via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('suno-generate', {
        body: { prompt, model, make_instrumental: instrumental }
      });

      if (error) throw error;

      return {
        success: true,
        taskId: data.task_id,
        clipsReceived: 2,
        creditsUsed: 1,
      };
    }
  );
}
```

### 2. Custom Music Generation

```typescript
import { trackCustomGeneration } from '@/lib/sentryAI';

async function generateCustomTrack(params: {
  title: string;
  lyrics: string;
  style: string;
  model: string;
  instrumental: boolean;
}) {
  return await trackCustomGeneration(
    params.model as 'V5' | 'V4_5',
    params.title,
    params.lyrics,
    params.style,
    params.instrumental,
    async () => {
      const { data, error } = await supabase.functions.invoke('suno-custom-generate', {
        body: {
          title: params.title,
          prompt: params.lyrics,
          style: params.style,
          model: params.model,
          instrumental: params.instrumental,
        }
      });

      if (error) throw error;

      return {
        success: true,
        taskId: data.task_id,
        expectedClips: 2,
      };
    }
  );
}
```

### 3. Stem Separation

```typescript
import { trackStemSeparation } from '@/lib/sentryAI';

async function separateStems(trackId: string, stemType: 'vocals' | 'drums' | 'bass' | 'other') {
  return await trackStemSeparation(
    'V5',
    trackId,
    stemType,
    async () => {
      const { data, error } = await supabase.functions.invoke('suno-separate-stems', {
        body: { track_id: trackId, stem_type: stemType }
      });

      if (error) throw error;

      return {
        success: true,
        trackIds: [data.vocal_id, data.instrumental_id],
      };
    }
  );
}
```

### 4. Audio Extension

```typescript
import { trackAudioExtension } from '@/lib/sentryAI';

async function extendTrack(clipId: string, continuationPrompt: string) {
  return await trackAudioExtension(
    'V5',
    clipId,
    continuationPrompt,
    async () => {
      const { data, error } = await supabase.functions.invoke('suno-extend', {
        body: { clip_id: clipId, continue_at: continuationPrompt }
      });

      if (error) throw error;

      return {
        success: true,
        taskId: data.task_id,
      };
    }
  );
}
```

### 5. Vocals Generation

```typescript
import { trackVocalsGeneration } from '@/lib/sentryAI';

async function addVocalsToTrack(trackId: string) {
  return await trackVocalsGeneration(
    'V5',
    trackId,
    async () => {
      const { data, error } = await supabase.functions.invoke('suno-add-vocals', {
        body: { track_id: trackId }
      });

      if (error) throw error;

      return {
        success: true,
        taskId: data.task_id,
      };
    }
  );
}
```

### 6. Multi-Step Workflow (Agent)

```typescript
import { trackSunoAgent, trackSunoTool } from '@/lib/sentryAI';

async function generateTrackWithArrangement() {
  return await trackSunoAgent(
    'full-track-production',
    { goal: 'create arranged track with vocals' },
    async () => {
      // Step 1: Generate base track
      const baseTrack = await trackSunoTool(
        'generate-base',
        { style: 'pop', duration: 120 },
        async () => {
          // Generate base instrumental
          return { success: true, trackId: 'base-123' };
        }
      );

      // Step 2: Add vocals
      const vocalsTrack = await trackSunoTool(
        'add-vocals',
        { baseTrackId: baseTrack.trackId },
        async () => {
          // Add vocals to base track
          return { success: true, trackId: 'vocals-456' };
        }
      );

      // Step 3: Separate stems
      const stems = await trackSunoTool(
        'separate-stems',
        { trackId: vocalsTrack.trackId },
        async () => {
          // Separate into stems
          return {
            success: true,
            stemIds: ['vocals-789', 'drums-789', 'bass-789']
          };
        }
      );

      return {
        success: true,
        baseTrackId: baseTrack.trackId,
        vocalsTrackId: vocalsTrack.trackId,
        stemIds: stems.stemIds,
      };
    }
  );
}
```

### 7. Manual Attribute Setting

For complex workflows where you need to add context mid-execution:

```typescript
import { trackSunoGeneration, setAIAttributes } from '@/lib/sentryAI';

async function complexGeneration() {
  return await trackSunoGeneration(
    {
      generationType: 'custom',
      model: 'V5',
      title: 'Complex Track',
    },
    async () => {
      // ... some work ...

      // Add additional context
      setAIAttributes({
        'suno.generation.custom_field': 'custom_value',
        'suno.generation.step': 'processing',
      });

      // ... more work ...

      return { success: true };
    }
  );
}
```

### 8. Adding Breadcrumbs

Track AI operations for better error context:

```typescript
import { addAIBreadcrumb } from '@/lib/sentryAI';

async function generateWithErrorHandling() {
  addAIBreadcrumb('generation', 'Starting generation', {
    model: 'V5',
    style: 'pop',
  });

  try {
    const result = await generateTrack();
    addAIBreadcrumb('generation', 'Generation completed', {
      taskId: result.taskId,
    });
    return result;
  } catch (error) {
    addAIBreadcrumb('error', 'Generation failed', {
      error: error.message,
      phase: 'api_call',
    });
    throw error;
  }
}
```

## Integration with Existing Code

### Option A: Wrap Edge Function Calls

Update your Supabase Edge Function invocations:

```typescript
// Before
const { data, error } = await supabase.functions.invoke('suno-generate', {
  body: { prompt, model }
});

// After
import { trackSimpleGeneration } from '@/lib/sentryAI';

const result = await trackSimpleGeneration(model, prompt, false, async () => {
  return await supabase.functions.invoke('suno-generate', {
    body: { prompt, model, make_instrumental: false }
  });
});

if (result.error) throw result.error;
const data = result.data;
```

### Option B: Update Existing Hooks

Modify your existing generation hooks to use AI monitoring:

**File: `src/hooks/useGenerateForm.ts` or similar**

```typescript
import { trackCustomGeneration } from '@/lib/sentryAI';

// Inside your hook
const handleGenerate = async () => {
  setLoading(true);

  try {
    const result = await trackCustomGeneration(
      model,
      title,
      lyrics,
      style,
      !hasVocals,
      async () => {
        // Your existing generation logic
        const { data, error } = await supabase.functions.invoke('suno-custom-generate', {
          body: {
            title,
            prompt: lyrics,
            style,
            model,
            instrumental: !hasVocals,
          }
        });

        if (error) throw error;
        return { success: true, taskId: data.task_id };
      }
    );

    // Handle success
    toast.success('Track generated!');
  } catch (error) {
    // Handle error
    toast.error('Generation failed');
  } finally {
    setLoading(false);
  }
};
```

## Monitoring in Sentry Dashboard

After integration, you'll see AI-specific data in Sentry:

### 1. **AI Spans Tab**
Navigate to: **Traces** → Select a trace → **AI Spans** tab

You'll see:
- `gen_ai.request` spans for each generation
- Model used (V5, V4_5, etc.)
- Generation type (simple, custom, stems, etc.)
- Duration and status
- Prompt/style snippets
- Credits used

### 2. **AI Agents Dashboard**
Navigate to: **AI** → **Agents**

You'll see:
- Agent execution timelines
- Tool usage breakdown
- Success/failure rates
- Latency percentiles

### 3. **Attributes for Filtering**

Use these attributes to filter and analyze:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `gen_ai.request.model` | Suno model version | `V5`, `V4_5` |
| `gen_ai.request.provider` | AI provider | `suno` |
| `suno.generation.type` | Operation type | `custom`, `stems`, `vocals` |
| `suno.generation.status` | Operation status | `success`, `error` |
| `suno.generation.duration_ms` | Duration in ms | `15000` |
| `suno.generation.credits_used` | Credits consumed | `2` |

## Best Practices

### ✅ DO

1. **Wrap all Suno API calls** with tracking functions
2. **Use specific functions** for each operation type
3. **Add breadcrumbs** for multi-step workflows
4. **Set meaningful attributes** for custom workflows
5. **Monitor in production** to optimize sampling rates

### ❌ DON'T

1. **Don't wrap synchronous code** - only async operations
2. **Don't include sensitive data** in prompts/styles (auto-truncated to 500 chars)
3. **Don't track in development** unless testing (uses sampling)
4. **Don't forget error handling** - let errors propagate for proper tracking

## Privacy & PII

- Prompts and lyrics are truncated to 500 characters before sending to Sentry
- Style tags are truncated to 500 characters
- User IDs are hashed by Sentry
- No raw audio data is collected

## Troubleshooting

### AI spans not appearing

1. **Check tracing is enabled:**
   ```typescript
   // src/lib/sentry.ts should have:
   tracesSampleRate: 0.1, // or higher
   ```

2. **Verify SDK version:**
   ```bash
   grep '@sentry/react' package.json
   # Should be 10.31.0 or higher
   ```

3. **Check production mode:**
   - AI monitoring works best in production
   - Development mode may have reduced sampling

### Missing attributes

1. Ensure you're returning the expected result shape:
   ```typescript
   {
     success: boolean,
     taskId?: string,
     trackIds?: string[],
     clipsReceived?: number,
     creditsUsed?: number,
   }
   ```

2. Use `setAIAttributes()` for custom data:
   ```typescript
   setAIAttributes({ 'custom.metric': 42 });
   ```

## Performance Impact

- **Overhead:** ~1-2ms per request (span creation)
- **Network:** Minimal (sent with existing Sentry data)
- **Sampling:** Controlled by `tracesSampleRate` (default 10%)
- **Storage:** Part of Sentry transaction quota

## Next Steps

1. ✅ Integration complete - AI monitoring is ready to use
2. 📊 Test in production with real generations
3. 📈 Review AI dashboard after 24-48 hours
4. 🔧 Adjust sampling rates based on volume
5. 🚀 Set up alerts for failure rates or latency

---

**Need help?** Check:
- [Sentry AI Monitoring Docs](https://docs.sentry.io/platforms/javascript/performance/ai-monitoring/)
- Project documentation in `docs/SUNO_API.md`
- Example implementations in `src/lib/sentryAI.ts`
