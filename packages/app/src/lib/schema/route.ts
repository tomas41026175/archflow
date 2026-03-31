import { z } from 'zod'

export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])

export type HttpMethod = z.infer<typeof httpMethodSchema>

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

export type RouteConfig = z.infer<typeof routeConfigSchema>
