import { z } from 'zod'

// --- Module Schema ---

export const moduleTypeSchema = z.enum([
  'page',
  'component',
  'hook',
  'service',
  'util',
  'api',
  'store',
  'type',
  'config',
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

// --- Layer Schema ---

export const layerSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color (#RRGGBB)'),
  order: z.number().int().min(0),
  modules: z.array(moduleSchema),
})

// --- Route Schema ---

export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])

export const routeEntrySchema: z.ZodType<RouteEntry> = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  handler: z.string().optional(),
  method: httpMethodSchema.optional(),
  guard: z.string().nullable().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  children: z.lazy(() => z.array(routeEntrySchema)).optional(),
})

export const routeConfigSchema = z.object({
  framework: z.enum(['nextjs', 'react-router', 'express', 'other']).optional(),
  basePath: z.string().optional(),
  entries: z.array(routeEntrySchema),
})

// --- State Flow Schema ---

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

// --- Connection Schema (cross-system API contracts) ---

export const connectionProtocolSchema = z.enum(['REST', 'GraphQL', 'gRPC', 'WebSocket', 'other'])

export const connectionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  protocol: connectionProtocolSchema.optional(),
  endpoint: z.string().optional(),
  method: httpMethodSchema.optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const connectionsConfigSchema = z.array(connectionSchema)

// --- Project Schema ---

export const projectInfoSchema = z.object({
  name: z.string().min(1),
  version: z.string().optional(),
  description: z.string().optional(),
  repository: z.string().optional(),
})

// --- Top-Level Config Schema ---

export const archflowConfigSchema = z.object({
  version: z.literal(1),
  project: projectInfoSchema,
  layers: z.array(layerSchema).optional(),
  routes: routeConfigSchema.optional(),
  stateFlows: stateFlowConfigSchema.optional(),
  connections: connectionsConfigSchema.optional(),
  analysis: z.any().optional(),  // Embedded AnalysisResult — validated separately via analysisResultSchema
})

// --- Inferred Types ---

export type ModuleType = z.infer<typeof moduleTypeSchema>
export type Module = z.infer<typeof moduleSchema>
export type Layer = z.infer<typeof layerSchema>
export type HttpMethod = z.infer<typeof httpMethodSchema>

// RouteEntry needs explicit interface for recursive z.lazy
export interface RouteEntry {
  path: string
  name: string
  handler?: string
  method?: HttpMethod
  guard?: string | null
  description?: string
  tags?: string[]
  children?: RouteEntry[]
}

export type RouteConfig = z.infer<typeof routeConfigSchema>
export type StateStore = z.infer<typeof stateStoreSchema>
export type StateFlowDirection = z.infer<typeof stateFlowDirectionSchema>
export type StateFlow = z.infer<typeof stateFlowSchema>
export type StateFlowConfig = z.infer<typeof stateFlowConfigSchema>
export type Connection = z.infer<typeof connectionSchema>
export type ConnectionProtocol = z.infer<typeof connectionProtocolSchema>
export type ProjectInfo = z.infer<typeof projectInfoSchema>
export type ArchflowConfig = z.infer<typeof archflowConfigSchema>
