import { z } from 'zod'

export const exportInfoSchema = z.object({
  name: z.string(),
  kind: z.enum([
    'function', 'class', 'variable', 'type', 'interface', 'enum', 'unknown',
  ]),
})

export const importDetailSchema = z.object({
  name: z.string(),
  alias: z.string().optional(),
  isTypeOnly: z.boolean(),
})

export const dependencyNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  filePath: z.string(),
  type: z.enum([
    'page', 'component', 'hook', 'util', 'api', 'store', 'type', 'config', 'unknown',
  ]),
  exports: z.array(exportInfoSchema),
})

export const dependencyEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  imports: z.array(importDetailSchema),
})

export const circularDependencySchema = z.object({
  cycle: z.array(z.string()),
  description: z.string(),
})

export const analysisResultSchema = z.object({
  metadata: z.object({
    analyzedAt: z.string(),
    rootDir: z.string(),
    fileCount: z.number(),
    nodeCount: z.number(),
    edgeCount: z.number(),
    circularCount: z.number().optional(),
  }),
  nodes: z.array(dependencyNodeSchema),
  edges: z.array(dependencyEdgeSchema),
  circular: z.array(circularDependencySchema).optional(),
})

export type AnalysisResult = z.infer<typeof analysisResultSchema>
export type AnalysisDependencyNode = z.infer<typeof dependencyNodeSchema>
export type AnalysisDependencyEdge = z.infer<typeof dependencyEdgeSchema>
export type CircularDependency = z.infer<typeof circularDependencySchema>
