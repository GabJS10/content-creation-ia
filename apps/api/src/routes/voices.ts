import { Hono } from 'hono'
import { db } from '../db'
import { voiceProfiles } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import type { AppVariables } from '../types'

const voices = new Hono<{ Variables: AppVariables }>()

voices.use('/*', async (c, next) => {
  const { authMiddleware } = await import('../middleware/auth')
  return authMiddleware(c as any, next)
})

interface VoiceProfileInput {
  name: string
  toneDescription: string
  styleExamples: string
  intellectualReferences: string
}

function validateInput(body: VoiceProfileInput): string | null {
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return 'name is required and must not be empty'
  }
  if (body.name.trim().length > 255) {
    return 'name must not exceed 255 characters'
  }
  if (
    !body.toneDescription ||
    typeof body.toneDescription !== 'string' ||
    body.toneDescription.trim() === ''
  ) {
    return 'toneDescription is required and must not be empty'
  }
  if (
    !body.styleExamples ||
    typeof body.styleExamples !== 'string' ||
    body.styleExamples.trim() === ''
  ) {
    return 'styleExamples is required and must not be empty'
  }
  if (
    !body.intellectualReferences ||
    typeof body.intellectualReferences !== 'string' ||
    body.intellectualReferences.trim() === ''
  ) {
    return 'intellectualReferences is required and must not be empty'
  }
  return null
}

voices.get('/', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  console.log('session', session)
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const profiles = await db
    .select({
      id: voiceProfiles.id,
      name: voiceProfiles.name,
      toneDescription: voiceProfiles.toneDescription,
      styleExamples: voiceProfiles.styleExamples,
      intellectualReferences: voiceProfiles.intellectualReferences,
      createdAt: voiceProfiles.createdAt,
    })
    .from(voiceProfiles)
    .where(eq(voiceProfiles.userId, userId))
    .orderBy(desc(voiceProfiles.createdAt))

  return c.json(profiles)
})

voices.get('/:id', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')

  const [profile] = await db
    .select({
      id: voiceProfiles.id,
      userId: voiceProfiles.userId,
      name: voiceProfiles.name,
      toneDescription: voiceProfiles.toneDescription,
      styleExamples: voiceProfiles.styleExamples,
      intellectualReferences: voiceProfiles.intellectualReferences,
      createdAt: voiceProfiles.createdAt,
    })
    .from(voiceProfiles)
    .where(eq(voiceProfiles.id, id))
    .limit(1)

  if (!profile || profile.userId !== userId) {
    return c.json({ error: 'Voice profile not found' }, 404)
  }

  return c.json(profile)
})

voices.post('/', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json<VoiceProfileInput>()
  const validationError = validateInput(body)

  if (validationError) {
    return c.json({ error: validationError }, 400)
  }

  const [profile] = await db
    .insert(voiceProfiles)
    .values({
      userId,
      name: body.name.trim(),
      toneDescription: body.toneDescription.trim(),
      styleExamples: body.styleExamples.trim(),
      intellectualReferences: body.intellectualReferences.trim(),
    })
    .returning()

  return c.json(profile, 201)
})

voices.put('/:id', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const body = await c.req.json<VoiceProfileInput>()
  const validationError = validateInput(body)

  if (validationError) {
    return c.json({ error: validationError }, 400)
  }

  const [existing] = await db
    .select({ id: voiceProfiles.id, userId: voiceProfiles.userId })
    .from(voiceProfiles)
    .where(eq(voiceProfiles.id, id))
    .limit(1)

  if (!existing || existing.userId !== userId) {
    return c.json({ error: 'Voice profile not found' }, 404)
  }

  const [profile] = await db
    .update(voiceProfiles)
    .set({
      name: body.name.trim(),
      toneDescription: body.toneDescription.trim(),
      styleExamples: body.styleExamples.trim(),
      intellectualReferences: body.intellectualReferences.trim(),
    })
    .where(eq(voiceProfiles.id, id))
    .returning()

  return c.json(profile)
})

voices.delete('/:id', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')

  const [existing] = await db
    .select({ id: voiceProfiles.id, userId: voiceProfiles.userId })
    .from(voiceProfiles)
    .where(eq(voiceProfiles.id, id))
    .limit(1)

  if (!existing || existing.userId !== userId) {
    return c.json({ error: 'Voice profile not found' }, 404)
  }

  await db.delete(voiceProfiles).where(eq(voiceProfiles.id, id))

  return c.json({ success: true })
})

export default voices
