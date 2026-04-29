import { sql } from 'drizzle-orm'
import { db } from '../db'
import { generateEmbeddings } from './embedding.service'
import type { SearchResult } from '@content-creation-ia/types'

export async function searchChunks(
  query: string,
  sourceIds: string[],
  topK: number = 5
): Promise<SearchResult[]> {
  if (!query || query.trim() === '') {
    throw new Error('Query cannot be empty')
  }

  if (!sourceIds || sourceIds.length === 0) {
    throw new Error('sourceIds cannot be empty')
  }

  const queryEmbedding = await generateEmbeddings([query.trim()])
  const vector = queryEmbedding[0]
  const vectorLiteral = `[${vector.join(',')}]`

  const results = (await db.execute(sql`
    SELECT 
      id,
      source_id,
      content,
      chunk_index,
      1 - (embedding <=> ${vectorLiteral}::vector) as similarity
    FROM knowledge_chunks
    WHERE source_id = ANY(${sourceIds}::uuid[])
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${topK}
  `)) as unknown as {
    rows: Array<{
      id: string
      source_id: string
      content: string
      chunk_index: number
      similarity: number
    }>
  }

  return results.rows.map((row) => ({
    chunkId: row.id,
    sourceId: row.source_id,
    content: row.content,
    chunkIndex: Number(row.chunk_index),
    similarity: Number(row.similarity),
  }))
}
