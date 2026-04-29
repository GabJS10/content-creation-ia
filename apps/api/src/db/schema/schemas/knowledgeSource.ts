import { uuid, timestamp, varchar, text, pgTable, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { user } from './user'
import { knowledgeChunks } from './knowledgeChunk'

export const knowledgeSources = pgTable('knowledge_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  errorMessage: varchar('error_message', { length: 500 }).default(''),
  chunksCount: integer('chunks_count').default(0),
})

export type KnowledgeSource = typeof knowledgeSources.$inferSelect
export type NewKnowledgeSource = typeof knowledgeSources.$inferInsert

export const knowledgeSourcesRelations = relations(knowledgeSources, ({ one, many }) => ({
  user: one(user, {
    fields: [knowledgeSources.userId],
    references: [user.id],
  }),
  chunks: many(knowledgeChunks),
}))
