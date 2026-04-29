import { uuid, timestamp, varchar, text, pgTable } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { user } from './user'

export const voiceProfiles = pgTable('voice_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  toneDescription: text('tone_description').notNull(),
  styleExamples: text('style_examples').notNull(),
  intellectualReferences: text('intellectual_references').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type VoiceProfile = typeof voiceProfiles.$inferSelect
export type NewVoiceProfile = typeof voiceProfiles.$inferInsert

export const voiceProfilesRelations = relations(voiceProfiles, ({ one }) => ({
  user: one(user, {
    fields: [voiceProfiles.userId],
    references: [user.id],
  }),
}))
