import { Hono } from 'hono'
import { db } from '../db'
import { ideas, generatedContents } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import type { AppVariables } from '../types'

const ideasRouter = new Hono<{ Variables: AppVariables }>()

ideasRouter.use('/*', async (c, next) => {
  const { authMiddleware } = await import('../middleware/auth')
  return authMiddleware(c as any, next)
})

interface IdeaInput {
  title?: string
  content?: string
  mode?: string
  voiceProfileId?: string
  selectedFormats?: string[]
}

function validateCreateInput(body: IdeaInput): string | null {
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return 'title is required and must not be empty'
  }
  if (body.title.trim().length > 255) {
    return 'title must not exceed 255 characters'
  }
  if (!body.content || typeof body.content !== 'string' || body.content.trim() === '') {
    return 'content is required and must not be empty'
  }
  if (!body.mode || typeof body.mode !== 'string') {
    return 'mode is required and must be "quick" or "draft"'
  }
  if (body.mode !== 'quick' && body.mode !== 'draft') {
    return 'mode must be "quick" or "draft"'
  }
  return null
}

ideasRouter.post('/', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json<IdeaInput>()
  const validationError = validateCreateInput(body)

  if (validationError) {
    return c.json({ error: validationError }, 400)
  }

  const [idea] = await db
    .insert(ideas)
    .values({
      userId,
      title: body.title!.trim(),
      content: body.content!.trim(),
      mode: body.mode!,
      voiceProfileId: body.voiceProfileId || null,
      selectedFormats: body.selectedFormats || [],
    })
    .returning()

  return c.json(idea, 201)
})

ideasRouter.get('/', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const allIdeas = await db
    .select()
    .from(ideas)
    .where(eq(ideas.userId, userId))
    .orderBy(desc(ideas.updatedAt))

  const ideasWithContents = await Promise.all(
    allIdeas.map(async (idea) => {
      const contents = await db
        .select()
        .from(generatedContents)
        .where(eq(generatedContents.ideaId, idea.id))
      return { ...idea, generatedContents: contents }
    })
  )

  return c.json(ideasWithContents)
})

ideasRouter.get('/:id', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')

  const [idea] = await db
    .select()
    .from(ideas)
    .where(eq(ideas.id, id))
    .limit(1)

  if (!idea || idea.userId !== userId) {
    return c.json({ error: 'Idea not found' }, 404)
  }

  const contents = await db
    .select()
    .from(generatedContents)
    .where(eq(generatedContents.ideaId, idea.id))

  return c.json({ ...idea, generatedContents: contents })
})

ideasRouter.put('/:id', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const body = await c.req.json<IdeaInput>()

  const [existing] = await db
    .select()
    .from(ideas)
    .where(eq(ideas.id, id))
    .limit(1)

  if (!existing || existing.userId !== userId) {
    return c.json({ error: 'Idea not found' }, 404)
  }

  const [idea] = await db
    .update(ideas)
    .set({
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.content !== undefined && { content: body.content.trim() }),
      ...(body.mode !== undefined && { mode: body.mode }),
      ...(body.voiceProfileId !== undefined && { voiceProfileId: body.voiceProfileId || null }),
      ...(body.selectedFormats !== undefined && { selectedFormats: body.selectedFormats }),
      updatedAt: new Date(),
    })
    .where(eq(ideas.id, id))
    .returning()

  return c.json(idea)
})

ideasRouter.delete('/:id', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')

  const [existing] = await db
    .select()
    .from(ideas)
    .where(eq(ideas.id, id))
    .limit(1)

  if (!existing || existing.userId !== userId) {
    return c.json({ error: 'Idea not found' }, 404)
  }

  await db.delete(ideas).where(eq(ideas.id, id))

  return c.json({ success: true })
})

export default ideasRouter