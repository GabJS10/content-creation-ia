import { uuid, timestamp, varchar, jsonb, pgTable } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { ideas } from './idea'

export const generatedContents = pgTable('generated_contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ideaId: uuid('idea_id').notNull().references(() => ideas.id, { onDelete: 'cascade' }),
  format: varchar('format', { length: 50 }).notNull(),
  content: jsonb('content').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('generating'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type GeneratedContent = typeof generatedContents.$inferSelect
export type NewGeneratedContent = typeof generatedContents.$inferInsert

export const generatedContentsRelations = relations(generatedContents, ({ one }) => ({
  idea: one(ideas, {
    fields: [generatedContents.ideaId],
    references: [ideas.id],
  }),
}))