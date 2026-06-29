import { z } from "zod";

export const GestureConfigSchema = z.object({
  swipeEnabled: z.boolean().default(true),
  swipeSensitivity: z.number().min(0.5).max(2.0).default(1.0),
  longPressEnabled: z.boolean().default(true),
  longPressDuration: z.number().min(300).max(800).default(500),
  doubleTapEnabled: z.boolean().default(true),
  pullToRefreshEnabled: z.boolean().default(true),
  hapticEnabled: z.boolean().default(true),
  hapticIntensity: z.enum(["light", "medium", "heavy"]).default("medium"),
});

export const UserPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]).default("auto"),
  textSize: z.enum(["small", "medium", "large"]).default("medium"),
  reducedMotion: z.boolean().default(false),
  audioQuality: z.enum(["low", "medium", "high"]).default("high"),
  notificationsEnabled: z.boolean().default(true),
  compactCards: z.boolean().default(false),
});

export type GestureConfig = z.infer<typeof GestureConfigSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const DEFAULT_GESTURE_CONFIG: GestureConfig = GestureConfigSchema.parse({});
export const DEFAULT_USER_PREFERENCES: UserPreferences = UserPreferencesSchema.parse({});
