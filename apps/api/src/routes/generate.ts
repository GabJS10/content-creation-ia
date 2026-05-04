import { Hono } from 'hono'
import { db } from '../db'
import { ideas, voiceProfiles, generatedContents } from '../db/schema'
import { eq } from 'drizzle-orm'
import OpenAI from 'openai'
import { env } from '../lib/env'
import { buildPrompt, extractJSON } from '../services/generation.service'
import { searchChunks } from '../services/search.service'
import type { AppVariables } from '../types'
import type { FormatOptions } from '../services/generation.service'

const generateRouter = new Hono<{ Variables: AppVariables }>()

generateRouter.use('/*', async (c, next) => {
  const { authMiddleware } = await import('../middleware/auth')
  return authMiddleware(c as any, next)
})

interface GenerateInput {
  ideaId: string
  formats: Array<'blog' | 'instagram' | 'video_script'>
  formatOptions: FormatOptions
  sourceIds?: string[]
}

generateRouter.post('/', async (c) => {
  const session = c.get('session')
  const userId = session?.userId

  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json<GenerateInput>()

  if (!body.ideaId) {
    return c.json({ error: 'ideaId is required' }, 400)
  }

  if (!body.formats || !Array.isArray(body.formats) || body.formats.length === 0) {
    return c.json({ error: 'formats is required and must be a non-empty array' }, 400)
  }

  const validFormats = ['blog', 'instagram', 'video_script']
  for (const f of body.formats) {
    if (!validFormats.includes(f)) {
      return c.json({ error: `Invalid format: ${f}` }, 400)
    }
  }

  const [idea] = await db.select().from(ideas).where(eq(ideas.id, body.ideaId)).limit(1)

  if (!idea || idea.userId !== userId) {
    return c.json({ error: 'Idea not found' }, 404)
  }

  if (idea.mode === 'quick' && (!body.sourceIds || body.sourceIds.length === 0)) {
    return c.json({ error: 'El modo rápido requiere al menos un documento de conocimiento' }, 400)
  }

  let voiceProfile = undefined
  if (idea.voiceProfileId) {
    const [vp] = await db
      .select()
      .from(voiceProfiles)
      .where(eq(voiceProfiles.id, idea.voiceProfileId))
      .limit(1)
    if (vp) {
      voiceProfile = vp
    }
  }

  console.log('sourceIds:', body.sourceIds)

  let ragContext: string | undefined
  if (body.sourceIds && body.sourceIds.length > 0) {
    const chunks = await searchChunks(idea.content, body.sourceIds, 5)
    if (chunks.length > 0) {
      ragContext = chunks.map((c) => c.content).join('\n\n')
    }
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      for (const format of body.formats) {
        const [contentRecord] = await db
          .insert(generatedContents)
          .values({
            ideaId: idea.id,
            format,
            content: {},
            status: 'generating',
          })
          .returning()

        sendEvent({ format, status: 'starting', contentId: contentRecord.id })

        try {
          const prompt = buildPrompt({
            idea: idea.content,
            mode: idea.mode as 'quick' | 'draft',
            format,
            formatOptions: body.formatOptions,
            voiceProfile,
            ragContext,
          })

          console.log('Generated prompt:', prompt)

          const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })

          const completion = await client.chat.completions.create({
            model: 'gpt-4.1',
            messages: [{ role: 'user', content: prompt }],
            stream: true,
          })

          let fullText = ''
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              fullText += text
              sendEvent({ format, status: 'streaming', chunk: text })
            }
          }

          try {
            const parsed = JSON.parse(extractJSON(fullText))
            await db
              .update(generatedContents)
              .set({ content: parsed, status: 'ready' })
              .where(eq(generatedContents.id, contentRecord.id))
            sendEvent({ format, status: 'done', contentId: contentRecord.id })
          } catch {
            await db
              .update(generatedContents)
              .set({ status: 'error' })
              .where(eq(generatedContents.id, contentRecord.id))
            sendEvent({ format, status: 'error', message: 'Error al parsear respuesta' })
          }
        } catch (err) {
          await db
            .update(generatedContents)
            .set({ status: 'error' })
            .where(eq(generatedContents.id, contentRecord.id))
          const errorMsg = err instanceof Error ? err.message : 'Unknown error'
          sendEvent({ format, status: 'error', message: errorMsg })
        }
      }

      sendEvent({ status: 'complete' })
      controller.close()
    },
  })

  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')
  c.header('X-Accel-Buffering', 'no')

  return c.body(stream)
})

export default generateRouter
