import { uuid, timestamp, varchar, pgTable } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './user'
import { knowledgeChunks } from './knowledgeChunk'

export const knowledgeSources = pgTable('knowledge_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type KnowledgeSource = typeof knowledgeSources.$inferSelect
export type NewKnowledgeSource = typeof knowledgeSources.$inferInsert

export const knowledgeSourcesRelations = relations(knowledgeSources, ({ one, many }) => ({
  user: one(users, {
    fields: [knowledgeSources.userId],
    references: [users.id],
  }),
  chunks: many(knowledgeChunks),
}))
