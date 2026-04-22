import { uuid, timestamp, varchar, text, pgTable } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { user } from './user'
import { voiceProfiles } from './voiceProfile'
import { generatedContents } from './generatedContent'

export const ideas = pgTable('ideas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  voiceProfileId: uuid('voice_profile_id').references(() => voiceProfiles.id, {
    onDelete: 'set null',
  }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  mode: varchar('mode', { length: 50 }).notNull(),
  selectedFormats: text('selected_formats').array().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Idea = typeof ideas.$inferSelect
export type NewIdea = typeof ideas.$inferInsert

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  user: one(user, {
    fields: [ideas.userId],
    references: [user.id],
  }),
  voiceProfile: one(voiceProfiles, {
    fields: [ideas.voiceProfileId],
    references: [voiceProfiles.id],
  }),
  generatedContents: many(generatedContents),
}))
