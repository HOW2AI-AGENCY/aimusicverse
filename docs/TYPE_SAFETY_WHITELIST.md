# Type Safety Whitelist

This document tracks the remaining `any` types in `src/` that are **intentional** and gated by inline `// eslint-disable-next-line` comments.

**Total budget:** **0** (zero `any` is the goal; remaining uses are documented and approved)

**Effective budget cap:** **50** (per `scripts/count-any.mjs` — any value above 50 fails the gate)

**Current count:** see `npm run typecheck:any-count` output (printed at end of this document)

## Categories

### 1. Third-party SDK type gaps (no upstream types)

Telegram WebApp SDK (`@twa-dev/sdk` 8.x) does not expose typed members for several APIs we use at runtime. These are guarded with version checks; the type cast is necessary because the SDK typings lag the runtime.

| File                                                               | Justification                                                                                                                                                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/contexts/telegram/useTelegramActions.ts`                      | `SettingsButton`, `shareToStory` — not in @twa-dev/sdk 8.x types                                                                                                                                                 |
| `src/contexts/telegram/useTelegramInit.ts`                         | `disableVerticalSwipes`, `lockOrientation`, `disableClosingConfirmation`, `requestFullscreen`, `contentSafeAreaInset`, `safeAreaInset`, `viewportHeight`, `viewportStableHeight` — not in @twa-dev/sdk 8.x types |
| `src/contexts/telegram/useTelegramInit.ts` (`types/telegram.d.ts`) | `onEvent` / `offEvent` payload `any`                                                                                                                                                                             |
| `src/lib/cloudStorage.ts`                                          | `(window as any).Telegram?.WebApp` — not in window type                                                                                                                                                          |
| `src/lib/mobile-utils.ts`                                          | `(window as any).Telegram?.WebApp?.HapticFeedback` — not in window type                                                                                                                                          |
| `src/lib/analytics/deeplink-tracker.ts`                            | `(window as any).Telegram?.WebApp?.initData` — not in window type                                                                                                                                                |

### 2. Generic constraint edges (intentional TS pattern)

The `T extends ComponentType<any>`, `T extends (...args: any[]) => any`, `T extends Record<string, any>` patterns are the **canonical TypeScript signatures** for utility types like `debounce`/`throttle`/`memoize`/`lazy`/`a11y`. Changing to `unknown` would break parameter inference. These are file-level `/* eslint-disable @typescript-eslint/no-explicit-any */` for the entire utility file.

| File                           | Pattern                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `src/lib/performance-utils.ts` | `debounce`/`throttle`/`useDebounce`/`memoize` generic constraints                     |
| `src/lib/performance.ts`       | `lazyWithRetry<T extends ComponentType<any>>`                                         |
| `src/lib/retry.ts`             | `debounce`/`throttle` generic constraints                                             |
| `src/lib/lazy.ts`              | `lazyLoad`/`createLazyRoute<T extends ComponentType<any>>`                            |
| `src/lib/type-guards.ts`       | `props: any` for discriminated-union type guards (narrowed via `props is ...` return) |
| `src/lib/a11y.ts`              | `useReducedMotionConfig<T extends Record<string, any>>`                               |

### 3. Web platform / browser API gaps (not in TS lib.dom)

| File                                   | Justification                                                        |
| -------------------------------------- | -------------------------------------------------------------------- |
| `src/contexts/NotificationContext.tsx` | `(window as any).webkitAudioContext` — webkit fallback not in TS lib |
| `src/lib/audioContextManager.ts`       | `(window as any).webkitAudioContext` — webkit fallback               |
| `src/lib/waveformWorkerPool.ts`        | `(window as any).webkitAudioContext` — webkit fallback               |
| `src/lib/audio/prefetchManager.ts`     | `requestIdleCallback` not in TS lib.dom                              |
| `src/lib/imageOptimization.ts`         | `requestIdleCallback` not in TS lib.dom                              |
| `src/lib/audioCache.ts`                | `navigator.connection` (NetworkInformation API) not in TS lib.dom    |
| `src/lib/imageOptimization.ts`         | `img.fetchPriority` not in TS HTMLImageElement type yet              |

### 4. Debug-only window augmentation (DevTools hooks)

| File                                | Justification                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `src/contexts/GuestModeContext.tsx` | `enableScreenshotMode`/`disableScreenshotMode` — debug-only window functions |
| `src/main.tsx`                      | `__BOOT_LOG`/`__getBootLog` — debug-only window functions for DevTools       |

### 5. LLM / untyped JSON shapes (unavoidable)

| File                             | Justification                                                            |
| -------------------------------- | ------------------------------------------------------------------------ |
| `src/lib/ai/aiResponseParser.ts` | LLM JSON output has heterogeneous schema; we narrow field-by-field       |
| `src/lib/ai/aiResponseParser.ts` | Universal parser accepts unknown payloads from LLM providers             |
| `src/hooks/useGuitarAnalysis.ts` | Edge function chord/strumming/notes results have heterogeneous key names |

### 6. Supabase / generated type gaps

| File                                                 | Justification                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/integrations/supabase/queries/versioning.ts`    | `metadata as any` — Supabase generated `Json` type is too strict for our union        |
| `src/integrations/supabase/queries/track-details.ts` | `response: any` — Response shape varies with `includeVersions`; narrowed at consumers |
| `src/lib/telegram/getOwnTelegramIds.ts`              | `.rpc("get_own_telegram_ids" as any)` — RPC overload missing from generated types     |
| `src/api/projects.api.ts`                            | Edge function return type is heterogeneous; callers narrow via service layer          |
| `src/api/studio.api.ts`                              | Edge function return type is heterogeneous; callers narrow via service layer          |
| `src/contexts/NotificationContext.tsx`               | `data as any[]` / Supabase realtime payload `any` — payload rows not yet typed        |

### 7. Thrown / error values

| File                               | Justification                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/errorHandling.ts`         | `parseGenerationError(response: any)` — Generation API error responses have heterogeneous shapes                                                      |
| `src/lib/gesture-manager.ts`       | `(data: any) => void` — Gesture event payloads are heterogeneous across providers                                                                     |
| `src/lib/suno-error-mapper.ts`     | `detectErrorCode`/`mapSunoError`/`isRetryableError`/`createSunoError`/`SunoError.originalError` — Accept any thrown value (Error/string/plain object) |
| `src/lib/trackActionConditions.ts` | `React.ComponentType<any>` — Icon components accept arbitrary Lucide props                                                                            |
| `src/lib/types/forms.ts`           | `updateField(field, value: any)` — Form field values are heterogeneous; narrowed at call sites                                                        |
| `src/lib/types/forms.ts`           | `metadata: Record<string, any>` — Form metadata is heterogeneous                                                                                      |
| `src/pages/VoiceHistoryPage.tsx`   | `catch (e: any)` — Catch-all unknown error from retry RPC                                                                                             |

### 8. Database metadata / dynamic keys

| File                                  | Justification                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/types/activity.ts`               | `ActivityMetadata[key: string]: any` — Activity metadata is heterogeneous                        |
| `src/services/lyrics/lyrics-types.ts` | `metadata?: Record<string, any>` — Lyrics metadata is heterogeneous                              |
| `src/types/starsPayment.ts`           | `metadata?: Record<string, any>` / `details?: Record<string, any>` — Provider-side heterogeneous |
| `src/hooks/useMusicGraph.ts`          | `metadata?: Record<string, any>` — Music graph node metadata is heterogeneous                    |

### 9. AI tool input shapes (heterogeneous by design)

| File                                                                          | Justification                                                            |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/components/generate-form/LyricsChatAssistant.tsx`                        | AI tool `Record<string, any>` — tool-specific types own the schema       |
| `src/components/lyrics-workspace/LyricsAIChatAgent.tsx`                       | AI tool `Record<string, any>`                                            |
| `src/components/lyrics-workspace/ai-agent/hooks/useAITools.ts`                | AI tool `Record<string, any>` — request body, execute input              |
| `src/components/lyrics-workspace/ai-agent/hooks/useWorkflowEngine.ts`         | Workflow initial input is heterogeneous across workflow definitions      |
| `src/components/lyrics-workspace/ai-agent/types.ts`                           | `ToolPanelProps.onExecute(input: Record<string, any>)`                   |
| `src/components/lyrics-workspace/ai-agent/WorkflowProgress.tsx`               | `stepResults: Record<number, any>` — heterogeneous workflow step outputs |
| `src/components/lyrics-workspace/ai-agent/results/FullAnalysisResultCard.tsx` | `QUICK_ACTION_ICONS: Record<string, any>` — icon map                     |
| `src/components/library/EmptyLibraryState.tsx`                                | React Router navigate `Record<string, any>` — loosely typed upstream     |

### 10. UI/icon map shapes

| File                                                     | Justification                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/components/track-detail/TrackChangelogTab.tsx`      | `icons: Record<string, any>` — change-type → icon map                      |
| `src/components/project/ProjectCreationWizard.tsx`       | `updateData: Record<string, any>` — partial update payload                 |
| `src/components/stem-studio/UnifiedWaveformTimeline.tsx` | `type WaveSurferInstance = any` — wavesurfer.js instance type not exported |
| `src/components/admin/MonitoringHub.tsx`                 | `healthStatus.checks` values are heterogeneous                             |

### 11. Admin / domain state

| File                              | Justification                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `src/pages/admin/AdminTracks.tsx` | `useState<any>(null)` for selected track — admin track shape is heterogeneous |
| `src/pages/AdminDashboard.tsx`    | Admin dialog state holds track union narrowed at dialog layer                 |
| `src/pages/AlbumView.tsx`         | First-track shape from album join; player accepts a narrow subset             |
| `src/pages/Community.tsx`         | Virtuoso itemData row may include extra fields (×2 + prompt legacy)           |
| `src/pages/PublicProfilePage.tsx` | Profile track may include public-only fields not on base Track type           |

## Adding a new whitelisted `any`

1. Add an inline `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <justification>` comment on the line above the use (or `/* eslint-disable */` block at top of the file for files with multiple uses).
2. Add an entry to this document under the appropriate category.
3. Run `npm run typecheck:any-count` to verify count stays under 50.
4. Open a follow-up issue to narrow the type later (don't leave a `// FIXME`).

## Justification format

The justification after `--` must be a brief, concrete reason (one sentence). Generic phrases like "any is needed" or "TODO" are **not** acceptable. The justification must explain _why_ the `any` is required and what the path forward is (e.g., "wait for upstream SDK type", "Supabase generated types lack RPC overload").

## Verification

```bash
npm run typecheck:any-count
# Expected output: ✓ any count N within budget 50
```

Where N is the current count of intentional `any` usages. As we narrow types in subsequent sprints, N should trend toward 0.
