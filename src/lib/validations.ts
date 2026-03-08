import { z } from 'zod';

// ─── Brief Schemas ───
export const briefCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  clientBoard: z.string().min(1, 'Client board is required'),
  contentType: z.string().optional().default('VIDEO'),
  publishDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date format'),
});

// ─── Automation Schemas ───
export const automationCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  trigger: z.string().min(1, 'Trigger is required'),
  triggerConfig: z.string().optional(),
  actions: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

// ─── Channel Schemas ───
export const channelCreateSchema = z.object({
  name: z.string().min(1, 'Channel name is required'),
  description: z.string().optional(),
  channelType: z.enum(['PUBLIC', 'PRIVATE', 'DIRECT']).optional().default('PUBLIC'),
  memberIds: z.array(z.string()).optional(),
});

// ─── Custom Field Schemas ───
export const fieldCreateSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  name: z.string().min(1, 'Name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  fieldType: z.string().optional().default('TEXT'),
  options: z.any().optional(),
  boardIds: z.array(z.string()).optional(),
});

export const fieldUpdateSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
  name: z.string().optional(),
  displayName: z.string().optional(),
  fieldType: z.string().optional(),
  options: z.any().optional(),
  boardIds: z.array(z.string()).optional(),
});

// ─── Message Schema ───
export const messageCreateSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
});

// ─── Admin SQL Query Schema (safe query) ───
export const adminQuerySchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  take: z.number().int().positive().max(200).optional(),
  skip: z.number().int().min(0).optional(),
  orderBy: z.record(z.string(), z.enum(['asc', 'desc'])).optional(),
});

// ─── Automation Execute Schema ───
export const automationExecuteSchema = z.object({
  trigger: z.string().min(1, 'Trigger is required'),
  cardId: z.string().min(1, 'Card ID is required'),
  fieldName: z.string().optional(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

// ─── Helper: parse and return 400 on failure ───
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, error: errors };
  }
  return { success: true, data: result.data };
}
