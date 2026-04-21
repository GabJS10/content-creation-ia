import { uuid, timestamp, varchar, pgTable } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { voiceProfiles } from './voiceProfile'
import { knowledgeSources } from './knowledgeSource'
import { ideas } from './idea'
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const usersRelations = relations(users, ({ many }) => ({
  voiceProfiles: many(voiceProfiles),
  knowledgeSources: many(knowledgeSources),
  ideas: many(ideas),
}))
