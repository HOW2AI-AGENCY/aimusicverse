# Music Metadata Processing

> 32 nodes · cohesion 0.10

## Key Concepts

- [track-naming.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L1) (20 connections)
- [telegram-metadata.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/telegram-metadata.ts#L1) (12 connections)
- [track-name-builder.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-name-builder.ts#L1) (12 connections)
- [buildTelegramMetadata()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/telegram-metadata.ts#L102) (9 connections)
- [sanitizeAndCleanTitle()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L133) (7 connections)
- [.extractBaseTitle()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-name-builder.ts#L119) (6 connections)
- [capitalizeTitle()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L118) (5 connections)
- [extractTitleFromFileName()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L166) (4 connections)
- [generateFallbackTitle()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L229) (4 connections)
- [buildSimpleCaption()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/telegram-metadata.ts#L175) (3 connections)
- [formatDuration()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/telegram-metadata.ts#L33) (3 connections)
- [removeNoiseWords()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L62) (3 connections)
- [sanitizeTrackTitle()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/suno-music-callback/index.ts#L42) (2 connections)
- [buildHashtags()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/telegram-metadata.ts#L74) (2 connections)
- [buildVersionCaption()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/telegram-metadata.ts#L201) (2 connections)
- [getModeEmoji()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/telegram-metadata.ts#L46) (2 connections)
- [getModeLabel()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/telegram-metadata.ts#L60) (2 connections)
- [buildTrackName()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-name-builder.ts#L236) (2 connections)
- [getPerformerName()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-name-builder.ts#L246) (2 connections)
- [applyPatterns()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L87) (2 connections)
- [cleanGenreTags()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L103) (2 connections)
- [escapeRegex()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L80) (2 connections)
- [sanitizeForTelegram()](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts#L214) (2 connections)
- [APP_HANDLE](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-name-builder.ts#L84) (1 connections)
- [APP_NAME](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-name-builder.ts#L79) (1 connections)
- *... and 7 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- [D:\.MUSICVERSE\aimusicverse\supabase\functions\_shared\telegram-metadata.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/telegram-metadata.ts)
- [D:\.MUSICVERSE\aimusicverse\supabase\functions\_shared\track-name-builder.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-name-builder.ts)
- [D:\.MUSICVERSE\aimusicverse\supabase\functions\_shared\track-naming.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/_shared/track-naming.ts)
- [D:\.MUSICVERSE\aimusicverse\supabase\functions\suno-music-callback\index.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/suno-music-callback/index.ts)

## Audit Trail

- EXTRACTED: 99 (83%)
- INFERRED: 20 (17%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*