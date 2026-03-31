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

export const fileMetricsSchema = z.object({
  lineCount: z.number(),
  anyCount: z.number(),
}).optional()

export const dependencyNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  filePath: z.string(),
  type: z.enum([
    'page', 'component', 'hook', 'util', 'api', 'store', 'type', 'config', 'unknown',
  ]),
  exports: z.array(exportInfoSchema),
  metrics: fileMetricsSchema,
})

export const dependencyEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  imports: z.array(importDetailSchema),
})

export const analysisResultSchema = z.object({
  metadata: z.object({
    analyzedAt: z.string(),
    rootDir: z.string(),
    fileCount: z.number(),
    nodeCount: z.number(),
    edgeCount: z.number(),
  }),
  nodes: z.array(dependencyNodeSchema),
  edges: z.array(dependencyEdgeSchema),
})

export type AnalysisResult = z.infer<typeof analysisResultSchema>
export type AnalysisDependencyNode = z.infer<typeof dependencyNodeSchema>
export type AnalysisDependencyEdge = z.infer<typeof dependencyEdgeSchema>
