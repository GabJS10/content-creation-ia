import OpenAI from 'openai'
import { env } from '../lib/env'

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 2048

export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  if (chunks.length === 0) {
    return []
  }

  const embeddings: number[][] = []

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)

    let retries = 3
    while (retries > 0) {
      try {
        const response = await client.embeddings.create({
          model: MODEL,
          input: batch,
        })
        const vectors = response.data.map(d => d.embedding)
        embeddings.push(...vectors)
        break
      } catch (err) {
        retries--
        if (retries === 0) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          throw new Error(`OpenAI API failed after 3 retries: ${message}`)
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)))
      }
    }
  }

  return embeddings
}