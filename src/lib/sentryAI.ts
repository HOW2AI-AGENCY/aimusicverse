/**
 * Sentry AI Agent Monitoring for Suno Music Generation
 *
 * This module provides custom instrumentation for tracking Suno AI music generation
 * operations in Sentry, including:
 * - Music generation requests (simple, custom, lyrics)
 * - Section regeneration
 * - Stem separation
 * - Audio extension
 * - Vocals/instrumental generation
 *
 * Uses Sentry's AI monitoring span types for observability.
 */

import { Sentry, isSentryEnabled } from './sentry';

// ==========================================
// Types
// ==========================================

export type SunoModel = 'V5' | 'V4_5' | 'V4_5PLUS' | 'V4' | 'V3_5';
export type GenerationType = 'simple' | 'custom' | 'lyrics' | 'extend' | 'section' | 'stems' | 'vocals' | 'instrumental';

export interface SunoGenerationContext {
  userId?: string;
  generationType: GenerationType;
  model: SunoModel;
  prompt?: string;
  title?: string;
  lyrics?: string;
  style?: string;
  hasVocals?: boolean;
  instrumental?: boolean;
  duration?: number;
  clipId?: string;
  sectionId?: string;
  stemType?: string;
  expectedClips?: number;
  projectId?: string;
  trackId?: string;
}

export interface SunoGenerationResult {
  success: boolean;
  taskId?: string;
  trackIds?: string[];
  error?: string;
  duration?: number;
  clipsReceived?: number;
  creditsUsed?: number;
}

// ==========================================
// AI Monitoring Functions
// ==========================================

/**
 * Track Suno AI music generation request
 * Wraps any Suno generation API call with AI monitoring
 *
 * @param context - Generation parameters and context
 * @param callback - Async function that performs the actual API call
 * @returns Generation result with telemetry
 */
export async function trackSunoGeneration<T = SunoGenerationResult>(
  context: SunoGenerationContext,
  callback: () => Promise<T>
): Promise<T> {
  if (!isSentryEnabled) {
    return callback();
  }

  const startTime = Date.now();

  return await Sentry.startSpan(
    {
      op: 'gen_ai.request',
      name: `Suno ${context.generationType} generation`,
      attributes: {
        'gen_ai.request.model': context.model,
        'gen_ai.request.provider': 'suno',
        'gen_ai.request.api': context.generationType,
        'suno.generation.type': context.generationType,
        'suno.generation.has_vocals': context.hasVocals ?? true,
        'suno.generation.instrumental': context.instrumental ?? false,
        'suno.project.id': context.projectId || 'none',
        'suno.track.id': context.trackId || 'none',
      },
    },
    async (span) => {
      try {
        // Record input parameters
        if (context.prompt) {
          span.setAttribute('gen_ai.request.prompt', context.prompt.slice(0, 500));
        }
        if (context.title) {
          span.setAttribute('suno.generation.title', context.title);
        }
        if (context.style) {
          span.setAttribute('suno.generation.style', context.style.slice(0, 500));
        }
        if (context.lyrics) {
          span.setAttribute('suno.generation.lyrics_length', context.lyrics.length);
          span.setAttribute('suno.generation.lyrics_preview', context.lyrics.slice(0, 200));
        }
        if (context.expectedClips) {
          span.setAttribute('suno.generation.expected_clips', context.expectedClips);
        }

        // Execute the actual generation
        const result = await callback();

        // Record successful result
        const duration = Date.now() - startTime;
        span.setAttribute('gen_ai.usage.total_tokens', 0); // Suno doesn't provide tokens
        span.setAttribute('suno.generation.duration_ms', duration);
        span.setAttribute('suno.generation.status', 'success');

        // Type guard for SunoGenerationResult
        if (result && typeof result === 'object' && 'success' in result) {
          const generationResult = result as SunoGenerationResult;
          if (generationResult.taskId) {
            span.setAttribute('suno.generation.task_id', generationResult.taskId);
          }
          if (generationResult.trackIds) {
            span.setAttribute('suno.generation.track_count', generationResult.trackIds.length);
          }
          if (generationResult.clipsReceived !== undefined) {
            span.setAttribute('suno.generation.clips_received', generationResult.clipsReceived);
          }
          if (generationResult.creditsUsed !== undefined) {
            span.setAttribute('suno.generation.credits_used', generationResult.creditsUsed);
          }
        }

        return result;
      } catch (error) {
        // Record error
        const duration = Date.now() - startTime;
        span.setAttribute('suno.generation.duration_ms', duration);
        span.setAttribute('suno.generation.status', 'error');
        span.setAttribute('suno.generation.error_message', error instanceof Error ? error.message : String(error));

        throw error;
      }
    }
  );
}

/**
 * Track Suno AI agent execution (for complex multi-step workflows)
 * Use this for operations that involve multiple AI calls or tool usage
 *
 * @param agentName - Name of the agent/workflow
 * @param context - Workflow context
 * @param callback - Async function that executes the workflow
 */
export async function trackSunoAgent<T>(
  agentName: string,
  context: Record<string, unknown>,
  callback: () => Promise<T>
): Promise<T> {
  if (!isSentryEnabled) {
    return callback();
  }

  return await Sentry.startSpan(
    {
      op: 'gen_ai.invoke_agent',
      name: `Suno Agent: ${agentName}`,
      attributes: {
        'gen_ai.agent.name': agentName,
        'gen_ai.agent.provider': 'suno',
        'gen_ai.agent.available_tools': JSON.stringify(['generate', 'extend', 'stems', 'vocals']),
      },
    },
    async (span) => {
      span.setAttribute('gen_ai.agent.input', JSON.stringify(context));

      try {
        const result = await callback();

        span.setAttribute('gen_ai.agent.output', JSON.stringify({ success: true }));
        span.setAttribute('gen_ai.agent.status', 'completed');

        return result;
      } catch (error) {
        span.setAttribute('gen_ai.agent.output', JSON.stringify({ success: false, error: String(error) }));
        span.setAttribute('gen_ai.agent.status', 'failed');
        throw error;
      }
    }
  );
}

/**
 * Track Suno tool execution (e.g., stem separation, audio extension)
 *
 * @param toolName - Name of the tool
 * @param toolInput - Tool parameters
 * @param callback - Async function that executes the tool
 */
export async function trackSunoTool<T>(
  toolName: string,
  toolInput: Record<string, unknown>,
  callback: () => Promise<T>
): Promise<T> {
  if (!isSentryEnabled) {
    return callback();
  }

  return await Sentry.startSpan(
    {
      op: 'gen_ai.execute_tool',
      name: `Suno Tool: ${toolName}`,
      attributes: {
        'gen_ai.tool.name': toolName,
        'gen_ai.tool.description': `Suno ${toolName} operation`,
        'gen_ai.tool.provider': 'suno',
      },
    },
    async (span) => {
      span.setAttribute('gen_ai.tool.input', JSON.stringify(toolInput));

      try {
        const result = await callback();

        span.setAttribute('gen_ai.tool.output', JSON.stringify({ success: true }));
        span.setAttribute('gen_ai.tool.status', 'completed');

        return result;
      } catch (error) {
        span.setAttribute('gen_ai.tool.output', JSON.stringify({ success: false, error: String(error) }));
        span.setAttribute('gen_ai.tool.status', 'failed');
        throw error;
      }
    }
  );
}

/**
 * Track agent handoff (for multi-agent workflows)
 *
 * @param fromAgent - Source agent name
 * @param toAgent - Target agent name
 * @param context - Handoff context
 * @param callback - Async function that performs the handoff
 */
export async function trackSunoHandoff<T>(
  fromAgent: string,
  toAgent: string,
  context: Record<string, unknown>,
  callback: () => Promise<T>
): Promise<T> {
  if (!isSentryEnabled) {
    return callback();
  }

  return await Sentry.startSpan(
    {
      op: 'gen_ai.handoff',
      name: `Handoff: ${fromAgent} -> ${toAgent}`,
      attributes: {
        'gen_ai.handoff.from_agent': fromAgent,
        'gen_ai.handoff.to_agent': toAgent,
        'gen_ai.handoff.provider': 'suno',
      },
    },
    async (span) => {
      span.setAttribute('gen_ai.handoff.context', JSON.stringify(context));

      try {
        const result = await callback();
        span.setAttribute('gen_ai.handoff.status', 'completed');
        return result;
      } catch (error) {
        span.setAttribute('gen_ai.handoff.status', 'failed');
        throw error;
      }
    }
  );
}

// ==========================================
// Convenience Wrappers for Common Operations
// ==========================================

/**
 * Track simple music generation
 */
export async function trackSimpleGeneration(
  model: SunoModel,
  prompt: string,
  makeInstrumental: boolean,
  callback: () => Promise<SunoGenerationResult>
): Promise<SunoGenerationResult> {
  return trackSunoGeneration(
    {
      generationType: 'simple',
      model,
      prompt,
      instrumental: makeInstrumental,
      hasVocals: !makeInstrumental,
    },
    callback
  );
}

/**
 * Track custom music generation
 */
export async function trackCustomGeneration(
  model: SunoModel,
  title: string,
  prompt: string,
  style: string,
  instrumental: boolean,
  callback: () => Promise<SunoGenerationResult>
): Promise<SunoGenerationResult> {
  return trackSunoGeneration(
    {
      generationType: 'custom',
      model,
      title,
      prompt,
      style,
      instrumental,
      hasVocals: !instrumental,
    },
    callback
  );
}

/**
 * Track lyrics generation
 */
export async function trackLyricsGeneration(
  prompt: string,
  callback: () => Promise<SunoGenerationResult>
): Promise<SunoGenerationResult> {
  return trackSunoGeneration(
    {
      generationType: 'lyrics',
      model: 'V5', // Lyrics generation uses V5
      prompt,
    },
    callback
  );
}

/**
 * Track audio extension
 */
export async function trackAudioExtension(
  model: SunoModel,
  clipId: string,
  continueAt: string,
  callback: () => Promise<SunoGenerationResult>
): Promise<SunoGenerationResult> {
  return trackSunoGeneration(
    {
      generationType: 'extend',
      model,
      clipId,
      prompt: continueAt,
    },
    callback
  );
}

/**
 * Track stem separation
 */
export async function trackStemSeparation(
  trackId: string,
  stemType: string,
  callback: () => Promise<SunoGenerationResult>
): Promise<SunoGenerationResult> {
  return trackSunoGeneration(
    {
      generationType: 'stems',
      model: 'V5', // Stem separation uses V5
      trackId,
      stemType,
    },
    callback
  );
}

/**
 * Track vocals generation
 */
export async function trackVocalsGeneration(
  model: SunoModel,
  trackId: string,
  callback: () => Promise<SunoGenerationResult>
): Promise<SunoGenerationResult> {
  return trackSunoGeneration(
    {
      generationType: 'vocals',
      model,
      trackId,
    },
    callback
  );
}

/**
 * Track instrumental generation
 */
export async function trackInstrumentalGeneration(
  model: SunoModel,
  trackId: string,
  callback: () => Promise<SunoGenerationResult>
): Promise<SunoGenerationResult> {
  return trackSunoGeneration(
    {
      generationType: 'instrumental',
      model,
      trackId,
    },
    callback
  );
}

/**
 * Track section regeneration
 */
export async function trackSectionRegeneration(
  model: SunoModel,
  trackId: string,
  sectionId: string,
  callback: () => Promise<SunoGenerationResult>
): Promise<SunoGenerationResult> {
  return trackSunoGeneration(
    {
      generationType: 'section',
      model,
      trackId,
      sectionId,
    },
    callback
  );
}

// ==========================================
// Manual Attribute Setting (for complex workflows)
// ==========================================

/**
 * Manually set AI span attributes
 * Use this within a tracked span to add additional context
 */
export function setAIAttributes(attributes: Record<string, string | number | boolean>): void {
  if (!isSentryEnabled) return;

  const span = Sentry.getActiveSpan();
  if (!span) {
    console.warn('[Sentry AI] No active span to set attributes on');
    return;
  }

  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });
}

/**
 * Add a breadcrumb for AI operations
 */
export function addAIBreadcrumb(
  category: 'generation' | 'stems' | 'vocals' | 'instrumental' | 'extend' | 'error',
  message: string,
  data?: Record<string, unknown>
): void {
  if (!isSentryEnabled) return;

  Sentry.addBreadcrumb({
    category: `ai_${category}`,
    message,
    level: category === 'error' ? 'error' : 'info',
    data: {
      provider: 'suno',
      ...data,
    },
  });
}
