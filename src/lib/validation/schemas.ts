/**
 * Validation Schemas
 *
 * Zod schemas for runtime validation across the application.
 * Provides type-safe input validation for forms, API calls, and data transformation.
 *
 * @module lib/validation/schemas
 */

import { z } from 'zod';

// ============ Common Schemas ============

/**
 * UUID schema for validating UUID strings
 */
export const uuidSchema = z.string().uuid();

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * Sorting schema
 */
export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

// ============ Track Schemas ============

/**
 * Track type enum
 */
export const trackTypeSchema = z.enum([
  'main',
  'vocal',
  'instrumental',
  'stem',
  'sfx',
  'drums',
  'bass',
  'other',
]);

/**
 * Track status enum
 */
export const trackStatusSchema = z.enum([
  'draft',
  'processing',
  'completed',
  'failed',
  'archived',
]);

/**
 * Track metadata schema
 */
export const trackMetadataSchema = z.object({
  suno_id: z.string().optional(),
  version_type: z.string().optional(),
  created_at: z.string().datetime().optional(),
});

/**
 * Track version schema
 */
export const trackVersionSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(50),
  audioUrl: z.string().url(),
  duration: z.number().nonnegative().optional(),
  metadata: trackMetadataSchema.optional(),
});

/**
 * Clip schema
 */
export const clipSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  audioUrl: z.string().url(),
  name: z.string().min(1).max(200),
  startTime: z.number().nonnegative(),
  duration: z.number().positive(),
  trimStart: z.number().nonnegative(),
  trimEnd: z.number().positive(),
  fadeIn: z.number().nonnegative().default(0),
  fadeOut: z.number().nonnegative().default(0),
  color: z.string().optional(),
  waveformData: z.array(z.number()).optional(),
});

/**
 * Track effects schema
 */
export const trackEffectsSchema = z.object({
  eq: z.boolean().optional(),
  reverb: z.number().min(0).max(1).optional(),
  compression: z.number().min(0).max(1).optional(),
});

/**
 * Studio track schema
 */
export const studioTrackSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: trackTypeSchema,
  audioUrl: z.string().url().optional(),
  volume: z.number().min(0).max(2),
  pan: z.number().min(-1).max(1),
  muted: z.boolean(),
  solo: z.boolean(),
  color: z.string(),
  clips: z.array(clipSchema),
  effects: trackEffectsSchema.optional(),
  status: trackStatusSchema.optional(),
  taskId: z.string().optional(),
  versions: z.array(trackVersionSchema).optional(),
  activeVersionLabel: z.string().optional(),
  errorMessage: z.string().optional(),
});

/**
 * Track form data schema (for creating/editing tracks)
 */
export const trackFormDataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: trackTypeSchema,
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(50)).max(20, 'Too many tags').optional(),
});

// ============ Project Schemas ============

/**
 * Project status enum
 */
export const projectStatusSchema = z.enum([
  'draft',
  'mixing',
  'mastering',
  'completed',
  'archived',
]);

/**
 * Stems mode enum
 */
export const stemsModeSchema = z.enum(['none', 'simple', 'detailed']);

/**
 * View mode enum
 */
export const viewModeSchema = z.enum(['timeline', 'mixer', 'compact']);

/**
 * View settings schema
 */
export const viewSettingsSchema = z.object({
  zoom: z.number().min(10).max(200).default(50),
  snapToGrid: z.boolean().default(true),
  gridSize: z.number().positive().default(4),
  viewMode: viewModeSchema.default('timeline'),
});

/**
 * Studio project schema
 */
export const studioProjectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  sourceTrackId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  bpm: z.number().positive().max(300),
  keySignature: z.string().optional(),
  timeSignature: z.string().default('4/4'),
  durationSeconds: z.number().nonnegative().optional(),
  masterVolume: z.number().min(0).max(2),
  tracks: z.array(studioTrackSchema),
  status: projectStatusSchema,
  stemsMode: stemsModeSchema,
  viewSettings: viewSettingsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  openedAt: z.string().datetime().optional(),
});

/**
 * Create project params schema
 */
export const createProjectParamsSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  sourceTrackId: z.string().uuid().optional(),
  sourceAudioUrl: z.string().url().optional(),
  duration: z.number().positive().optional(),
  tracks: z.array(studioTrackSchema.partial({ id: true, clips: true })).optional(),
});

// ============ User/Profile Schemas ============

/**
 * User profile schema
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  telegram_id: z.number().int().positive(),
  username: z.string().optional(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
  is_public: z.boolean().default(false),
  is_premium: z.boolean().default(false),
  credits_balance: z.number().int().nonnegative().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores').optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
  is_public: z.boolean().optional(),
});

// ============ Lyrics Schemas ============

/**
 * Note type enum
 */
export const noteTypeSchema = z.enum([
  'suggestion',
  'correction',
  'question',
  'idea',
  'todo',
]);

/**
 * Studio lyric version schema
 */
export const studioLyricVersionSchema = z.object({
  id: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  content: z.string(),
  isCurrent: z.boolean(),
  changeSummary: z.string().optional(),
  createdAt: z.union([z.string().datetime(), z.date()]),
});

/**
 * Studio section note schema
 */
export const studioSectionNoteSchema = z.object({
  id: z.string().uuid(),
  sectionId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  noteType: noteTypeSchema,
  isResolved: z.boolean(),
  createdAt: z.union([z.string().datetime(), z.date()]),
  updatedAt: z.union([z.string().datetime(), z.date()]),
});

/**
 * Lyrics form data schema
 */
export const lyricsFormDataSchema = z.object({
  content: z.string().min(1, 'Lyrics content is required'),
  changeSummary: z.string().max(200).optional(),
});

// ============ Generation Schemas ============

/**
 * Generation params schema
 */
export const generationParamsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000),
  title: z.string().max(200).optional(),
  tags: z.string().optional(),
  style: z.string().optional(),
  duration: z.number().positive().optional(),
  isInstrumental: z.boolean().default(false),
  customMode: z.boolean().default(false),
});

// ============ Comment Schemas ============

/**
 * Comment schema
 */
export const commentSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Create comment schema
 */
export const createCommentSchema = z.object({
  trackId: z.string().uuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  parentId: z.string().uuid().optional(),
});

// ============ Report Schemas ============

/**
 * Report reason enum
 */
export const reportReasonSchema = z.enum([
  'inappropriate',
  'copyright',
  'spam',
  'harassment',
  'other',
]);

/**
 * Create report schema
 */
export const createReportSchema = z.object({
  entityType: z.enum(['track', 'comment', 'user']),
  entityId: z.string().uuid(),
  reason: reportReasonSchema,
  description: z.string().max(500).optional(),
});

// ============ Export all schemas ============

export const schemas = {
  // Common
  uuid: uuidSchema,
  pagination: paginationSchema,
  sort: sortSchema,

  // Track
  trackType: trackTypeSchema,
  trackStatus: trackStatusSchema,
  trackVersion: trackVersionSchema,
  clip: clipSchema,
  trackEffects: trackEffectsSchema,
  studioTrack: studioTrackSchema,
  trackFormData: trackFormDataSchema,

  // Project
  projectStatus: projectStatusSchema,
  stemsMode: stemsModeSchema,
  viewMode: viewModeSchema,
  viewSettings: viewSettingsSchema,
  studioProject: studioProjectSchema,
  createProjectParams: createProjectParamsSchema,

  // User/Profile
  userProfile: userProfileSchema,
  updateProfile: updateProfileSchema,

  // Lyrics
  noteType: noteTypeSchema,
  studioLyricVersion: studioLyricVersionSchema,
  studioSectionNote: studioSectionNoteSchema,
  lyricsFormData: lyricsFormDataSchema,

  // Generation
  generationParams: generationParamsSchema,

  // Comment
  comment: commentSchema,
  createComment: createCommentSchema,

  // Report
  reportReason: reportReasonSchema,
  createReport: createReportSchema,
};

// Type inference from schemas
export type PaginationParams = z.infer<typeof paginationSchema>;
export type SortParams = z.infer<typeof sortSchema>;
export type TrackFormData = z.infer<typeof trackFormDataSchema>;
export type CreateProjectParams = z.infer<typeof createProjectParamsSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type LyricsFormData = z.infer<typeof lyricsFormDataSchema>;
export type GenerationParams = z.infer<typeof generationParamsSchema>;
export type CreateCommentData = z.infer<typeof createCommentSchema>;
export type CreateReportData = z.infer<typeof createReportSchema>;
