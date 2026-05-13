import { Hono } from 'hono'
import { db } from '../db'
import { user } from '../db/schema'
import { eq } from 'drizzle-orm'
import { encrypt } from '../services/encryption.service'
import type { AppVariables } from '../types'

const profileRouter = new Hono<{ Variables: AppVariables }>()

profileRouter.use('/*', async (c, next) => {
  const { authMiddleware } = await import('../middleware/auth')
  return authMiddleware(c as any, next)
})

profileRouter.get('/', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [userRecord] = await db.select().from(user).where(eq(user.id, userId)).limit(1)

  if (!userRecord) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    displayName: userRecord.displayName,
    hasApiKey: !!userRecord.openaiApiKey,
  })
})

interface UpdateProfileInput {
  displayName?: string
  openaiApiKey?: string
}

profileRouter.put('/', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json<UpdateProfileInput>()

  if (body.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || body.displayName.trim().length === 0) {
      return c.json({ error: 'displayName cannot be empty' }, 400)
    }
    if (body.displayName.length > 255) {
      return c.json({ error: 'displayName must be at most 255 characters' }, 400)
    }
  }

  if (body.openaiApiKey !== undefined) {
    if (typeof body.openaiApiKey !== 'string') {
      return c.json({ error: 'openaiApiKey must be a string' }, 400)
    }
    if (!body.openaiApiKey.startsWith('sk-') || body.openaiApiKey.length <= 20) {
      return c.json(
        { error: 'openaiApiKey must start with "sk-" and be longer than 20 characters' },
        400
      )
    }
  }

  const updates: Partial<{ displayName: string; openaiApiKey: string; name: string }> = {}

  if (body.displayName !== undefined) {
    const trimmed = body.displayName.trim()
    updates.displayName = trimmed
    updates.name = trimmed
  }

  if (body.openaiApiKey !== undefined) {
    updates.openaiApiKey = encrypt(body.openaiApiKey)
  }

  if (Object.keys(updates).length > 0) {
    await db.update(user).set(updates).where(eq(user.id, userId))
  }

  const [updatedUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1)

  return c.json({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    displayName: updatedUser.displayName,
    hasApiKey: !!updatedUser.openaiApiKey,
  })
})

export default profileRouter