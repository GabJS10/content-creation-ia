import type { Session, User } from 'better-auth'

export type AppVariables = {
  session: Session | null
  user: User | null
}

declare module 'hono' {
  interface ContextVariables {
    session: Session | null
    user: User | null
  }
}