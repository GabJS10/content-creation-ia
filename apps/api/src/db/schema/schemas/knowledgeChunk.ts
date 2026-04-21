import { uuid, integer, text, pgTable, vector } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { knowledgeSources } from './knowledgeSource'

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id')
    .notNull()
    .references(() => knowledgeSources.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  chunkIndex: integer('chunk_index').notNull(),
})

export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect
export type NewKnowledgeChunk = typeof knowledgeChunks.$inferInsert

export const knowledgeChunksRelations = relations(knowledgeChunks, ({ one }) => ({
  source: one(knowledgeSources, {
    fields: [knowledgeChunks.sourceId],
    references: [knowledgeSources.id],
  }),
}))
