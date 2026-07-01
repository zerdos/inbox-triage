import { z } from "zod";

export const inboxItemSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  subject: z.string(),
  body: z.string().min(1),
  receivedAt: z.string(),
});

export const triageRequestSchema = z.object({
  items: z.array(inboxItemSchema).min(1).max(50),
});

export const triageResultSchema = z.object({
  id: z.string(),
  category: z.string(),
  urgency: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  actionItems: z.array(z.string()),
  summary: z.string(),
});

export const draftReplyRequestSchema = z.object({
  item: inboxItemSchema,
  triage: triageResultSchema,
});
