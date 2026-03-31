import { z } from 'zod'
import { layerSchema } from './layer'
import { routeConfigSchema } from './route'
import { stateFlowConfigSchema } from './stateFlow'
import { connectionsConfigSchema } from './connection'

export const projectInfoSchema = z.object({
  name: z.string().min(1),
  version: z.string().optional(),
  description: z.string().optional(),
  repository: z.string().optional(),
})

export const archflowConfigSchema = z.object({
  version: z.literal(1),
  project: projectInfoSchema,
  layers: z.array(layerSchema).optional(),
  routes: routeConfigSchema.optional(),
  stateFlows: stateFlowConfigSchema.optional(),
  connections: connectionsConfigSchema.optional(),
  analysis: z.any().optional(),
})

export type ProjectInfo = z.infer<typeof projectInfoSchema>
export type ArchflowConfig = z.infer<typeof archflowConfigSchema>
