import { z } from 'zod'

export const moduleTypeSchema = z.enum([
  'page', 'component', 'hook', 'service', 'util', 'api', 'store', 'type', 'config',
])

export const moduleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: moduleTypeSchema.optional(),
  files: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dependsOn: z.array(z.string()).optional(),
  endpoints: z.array(z.string()).optional(),
  externalUrl: z.string().url().optional(),
})

export const layerSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color (#RRGGBB)'),
  order: z.number().int().min(0),
  modules: z.array(moduleSchema),
})

export type ModuleType = z.infer<typeof moduleTypeSchema>
export type Module = z.infer<typeof moduleSchema>
export type Layer = z.infer<typeof layerSchema>
