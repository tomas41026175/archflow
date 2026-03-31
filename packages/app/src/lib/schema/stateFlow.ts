import { z } from 'zod'

export const stateStoreSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  file: z.string().optional(),
  atoms: z.array(z.string()).optional(),
})

export const stateFlowDirectionSchema = z.enum(['read', 'write', 'read-write'])

export const stateFlowSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  sourceFile: z.string().optional(),
  targetFile: z.string().optional(),
  atoms: z.array(z.string()).optional(),
  direction: stateFlowDirectionSchema,
  description: z.string().optional(),
})

export const stateFlowConfigSchema = z.object({
  library: z.enum(['jotai', 'zustand', 'redux', 'context', 'other']).optional(),
  stores: z.array(stateStoreSchema),
  flows: z.array(stateFlowSchema),
})

export type StateStore = z.infer<typeof stateStoreSchema>
export type StateFlowDirection = z.infer<typeof stateFlowDirectionSchema>
export type StateFlow = z.infer<typeof stateFlowSchema>
export type StateFlowConfig = z.infer<typeof stateFlowConfigSchema>
