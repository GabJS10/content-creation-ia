import { Hono } from 'hono'
import { db } from '../db'
import { knowledgeSources } from '../db/schema'
import { getChannel } from '../lib/rabbitmq'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const knowledge = new Hono()

const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000'

knowledge.post('/upload', async (c) => {
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
      userId: DUMMY_USER_ID,
      title: title.trim(),
      filePath,
      status: 'pending',
    })
    .returning()

  const channel = getChannel()
  channel.sendToQueue(
    'knowledge_processing',
    Buffer.from(JSON.stringify({
      source_id: result.id,
      file_path: filePath,
    }))
  )

  return c.json({
    source_id: result.id,
    title: result.title,
    status: 'pending',
  }, 202)
})

export default knowledge