import { z } from 'zod'
import { httpMethodSchema } from './route'

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

export type Connection = z.infer<typeof connectionSchema>
export type ConnectionProtocol = z.infer<typeof connectionProtocolSchema>
