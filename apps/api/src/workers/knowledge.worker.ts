import { ConsumeMessage } from 'amqplib'
import { db } from '../db'
import { knowledgeSources, knowledgeChunks } from '../db/schema'
import { getChannel } from '../lib/rabbitmq'
import { publish } from '../lib/redis'
import { extractAndChunk } from '../services/pdf.service'
import { generateEmbeddings } from '../services/embedding.service'
import { eq } from 'drizzle-orm'

interface JobMessage {
  source_id: string
  file_path: string
}

export async function startWorker(): Promise<void> {
  const channel = getChannel()
  await channel.prefetch(1)

  channel.consume('knowledge_processing', async (msg: ConsumeMessage | null) => {
    if (!msg) return

    let job: JobMessage
    try {
      job = JSON.parse(msg.content.toString())
    } catch {
      console.error('Failed to parse message:', msg.content.toString())
      channel.nack(msg, false, false)
      return
    }

    const { source_id, file_path } = job

    const mb = () => Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10

    try {
      publish(`source:${source_id}`, {
        stage: 'received',
        message: 'Documento recibido, iniciando procesamiento...',
      })
      await db
        .update(knowledgeSources)
        .set({ status: 'processing' })
        .where(eq(knowledgeSources.id, source_id))

      publish(`source:${source_id}`, {
        stage: 'reading',
        message: 'Leyendo archivo PDF...',
      })
      const fullPath = `${process.cwd()}/${file_path}`

      publish(`source:${source_id}`, {
        stage: 'extracting',
        message: 'Extrayendo texto del documento...',
      })
      publish(`source:${source_id}`, {
        stage: 'chunking',
        message: 'Dividiendo texto en bloques...',
      })
      console.log(`[${mb()}MB] Extrayendo y chunkeando...`)
      const chunks = await extractAndChunk(fullPath)
      console.log(`[${mb()}MB] Chunks generados: ${chunks.length}`)

      if (chunks.length === 0) {
        await db
          .update(knowledgeSources)
          .set({
            status: 'error',
            errorMessage: 'No chunks generated from document',
          })
          .where(eq(knowledgeSources.id, source_id))
        publish(`source:${source_id}`, {
          stage: 'error',
          message: 'No chunks generated from document',
        })
        channel.ack(msg)
        return
      }

      publish(`source:${source_id}`, {
        stage: 'embedding',
        message: 'Generando embeddings semánticos...',
      })
      console.log(`[${mb()}MB] Generando embeddings...`)
      const embeddings = await generateEmbeddings(chunks)

      publish(`source:${source_id}`, {
        stage: 'saving',
        message: 'Guardando en base de conocimiento...',
      })
      console.log(`[${mb()}MB] Guardando...`)

      const chunkRecords = chunks.map((content: string, index: number) => ({
        sourceId: source_id,
        content,
        embedding: embeddings[index],
        chunkIndex: index,
      }))

      await db.insert(knowledgeChunks).values(chunkRecords)

      await db
        .update(knowledgeSources)
        .set({
          status: 'ready',
          chunksCount: chunks.length,
        })
        .where(eq(knowledgeSources.id, source_id))

      publish(`source:${source_id}`, {
        stage: 'ready',
        message: 'Documento listo.',
        chunks_count: chunks.length,
      })

      console.log('Listo')

      channel.ack(msg)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`Worker error for source ${source_id}:`, err)

      publish(`source:${source_id}`, {
        stage: 'error',
        message: errorMessage,
      })

      await db
        .update(knowledgeSources)
        .set({
          status: 'error',
          errorMessage,
        })
        .where(eq(knowledgeSources.id, source_id))

      channel.nack(msg, false, false)
    }
  })

  console.log('Knowledge worker started')
}
