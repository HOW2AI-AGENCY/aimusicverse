import { z } from "zod";

export const GestureSettingsSchema = z.object({
  doubleTapSeek: z.object({
    enabled: z.boolean().default(true),
    seekAmount: z.number().int().min(5).max(30).default(10),
    leftSideEnabled: z.boolean().default(true),
    rightSideEnabled: z.boolean().default(true),
  }),
  horizontalSwipe: z.object({
    enabled: z.boolean().default(true),
    threshold: z.number().int().min(50).max(150).default(80),
    velocityThreshold: z.number().int().min(200).max(800).default(400),
  }),
  hintOverlay: z.object({
    shown: z.boolean().default(false),
    dismissed: z.boolean().default(false),
    lastShown: z.number().int().positive().optional(),
  }),
  keyboard: z.object({
    enabled: z.boolean().default(true),
    seekAmount: z.number().int().min(5).max(30).default(10),
  }),
  version: z.literal(1),
  lastUpdated: z.number().int().positive(),
});
