import type { MiddlewareHandler } from 'hono'
import { auth } from '../lib/auth'
import type { AppVariables } from '../types'

export const authMiddleware: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  const headers = c.req.raw.headers
  const result = await auth.api.getSession({ headers })

  if (!result) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('session', result.session)
  c.set('user', result.user)

  await next()
}