import OpenAI from 'openai'
import { env } from '../lib/env'

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })

const MODEL = 'text-embedding-3-small'
const MAX_TOKENS_PER_BATCH = 200000
const MAX_CHUNK_WORDS = 2000
const TOKENS_PER_WORD = 1.5

function buildBatches(chunks: string[]): string[][] {
  const safeChunks: string[] = []

  for (const chunk of chunks) {
    const words = chunk.split(/\s+/).filter((w) => w.length > 0)
    if (words.length > MAX_CHUNK_WORDS) {
      for (let i = 0; i < words.length; i += MAX_CHUNK_WORDS) {
        safeChunks.push(words.slice(i, i + MAX_CHUNK_WORDS).join(' '))
      }
    } else {
      safeChunks.push(chunk)
    }
  }

  const batches: string[][] = []
  let currentBatch: string[] = []
  let currentTokens = 0

  for (const chunk of safeChunks) {
    const chunkWordCount = chunk.split(/\s+/).filter((w) => w.length > 0).length
    const chunkTokens = Math.ceil(chunkWordCount * TOKENS_PER_WORD)

    if (currentTokens + chunkTokens > MAX_TOKENS_PER_BATCH && currentBatch.length > 0) {
      batches.push(currentBatch)
      currentBatch = [chunk]
      currentTokens = chunkTokens
    } else {
      currentBatch.push(chunk)
      currentTokens += chunkTokens
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch)
  }
  console.log('batches')

  return batches
}

export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  if (chunks.length === 0) {
    return []
  }

  const batches = buildBatches(chunks)
  const embeddings: number[][] = []

  for (const batch of batches) {
    let retries = 3
    while (retries > 0) {
      try {
        const response = await client.embeddings.create({
          model: MODEL,
          input: batch,
        })
        const vectors = response.data.map((d) => d.embedding)
        embeddings.push(...vectors)
        break
      } catch (err) {
        retries--
        if (retries === 0) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          throw new Error(`OpenAI API failed after 3 retries: ${message}`)
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (4 - retries)))
      }
    }
  }

  return embeddings
}
