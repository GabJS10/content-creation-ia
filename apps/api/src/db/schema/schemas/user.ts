import { timestamp, varchar, pgTable, text, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { voiceProfiles } from './voiceProfile'
import { knowledgeSources } from './knowledgeSource'
import { ideas } from './idea'
import { session, account } from './auth-schema'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  image: text('image'),
})

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export const userRelations = relations(user, ({ many }) => ({
  voiceProfiles: many(voiceProfiles),
  knowledgeSources: many(knowledgeSources),
  ideas: many(ideas),
  sessions: many(session),
  accounts: many(account),
}))
