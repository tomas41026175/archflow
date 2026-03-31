import { add } from './utils.js'
import type { User } from './types.js'

export function createUser(name: string): User {
  return { id: String(add(Date.now(), 1)), name }
}
