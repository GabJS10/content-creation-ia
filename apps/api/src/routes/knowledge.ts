import { Hono } from 'hono'
import { db } from '../db'
import { knowledgeSources, knowledgeChunks } from '../db/schema'
import { getChannel } from '../lib/rabbitmq'
import { subscribe } from '../lib/redis'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { eq, desc } from 'drizzle-orm'
import type { AppVariables } from '../types'

const knowledge = new Hono<{ Variables: AppVariables }>()

knowledge.use('/*', async (c, next) => {
  const { authMiddleware } = await import('../middleware/auth')
  return authMiddleware(c as any, next)
})

knowledge.post('/upload', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  console.log('session', session)

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.parseBody()
  const title = body['title']
  const file = body['file']

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return c.json({ error: 'Title is required' }, 400)
  }

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'File is required' }, 400)
  }

  if (file.type !== 'application/pdf') {
    return c.json({ error: 'Only PDF files are allowed' }, 400)
  }

  const uploadsDir = join(process.cwd(), 'uploads')
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }

  const buffer = await file.arrayBuffer()
  const timestamp = Date.now()
  const fileName = `${randomUUID()}-${timestamp}.pdf`
  const filePath = `uploads/${fileName}`

  const fullPath = join(process.cwd(), filePath)
  await writeFile(fullPath, Buffer.from(buffer))

  const [result] = await db
    .insert(knowledgeSources)
    .values({
      userId,
      title: title.trim(),
      filePath,
      status: 'pending',
    })
    .returning()

  const channel = getChannel()
  channel.sendToQueue(
    'knowledge_processing',
    Buffer.from(
      JSON.stringify({
        source_id: result.id,
        file_path: filePath,
      })
    )
  )

  return c.json(
    {
      source_id: result.id,
      title: result.title,
      status: 'pending',
    },
    202
  )
})

knowledge.get('/', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const sources = await db
    .select({
      id: knowledgeSources.id,
      title: knowledgeSources.title,
      status: knowledgeSources.status,
      chunksCount: knowledgeSources.chunksCount,
      errorMessage: knowledgeSources.errorMessage,
      createdAt: knowledgeSources.createdAt,
    })
    .from(knowledgeSources)
    .where(eq(knowledgeSources.userId, userId))
    .orderBy(desc(knowledgeSources.createdAt))

  return c.json(sources)
})

knowledge.delete('/:source_id', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const sourceId = c.req.param('source_id')

  const [source] = await db
    .select()
    .from(knowledgeSources)
    .where(eq(knowledgeSources.id, sourceId))
    .limit(1)

  if (!source) {
    return c.json({ error: 'Source not found' }, 404)
  }

  if (source.userId !== userId) {
    return c.json({ error: 'Source not found' }, 404)
  }

  await db.delete(knowledgeChunks).where(eq(knowledgeChunks.sourceId, sourceId))
  await db.delete(knowledgeSources).where(eq(knowledgeSources.id, sourceId))

  return c.json({ success: true })
})

knowledge.get('/:source_id/stream', async (c) => {
  const sourceId = c.req.param('source_id')

  const [source] = await db
    .select()
    .from(knowledgeSources)
    .where(eq(knowledgeSources.id, sourceId))
    .limit(1)

  if (!source) {
    return c.json({ error: 'Source not found' }, 404)
  }

  if (source.status === 'ready' || source.status === 'error') {
    const eventData = JSON.stringify({
      stage: source.status,
      message:
        source.errorMessage ||
        (source.status === 'ready' ? 'Documento listo.' : 'Error en procesamiento'),
    })
    const body = `data: ${eventData}\n\n`
    return c.body(body, 200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      subscribe(`source:${sourceId}`, (message) => {
        try {
          const event = JSON.parse(message)
          sendEvent(event)
          if (event.stage === 'ready' || event.stage === 'error') {
            controller.close()
          }
        } catch {
          controller.close()
        }
      })
    },
  })

  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')
  c.header('X-Accel-Buffering', 'no')

  return c.body(stream)
})

export default knowledge
