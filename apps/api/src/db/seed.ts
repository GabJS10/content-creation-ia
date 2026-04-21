import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/'
import 'dotenv/config'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

async function seed() {
  console.log('🌱 Seeding database...')

  // ── 1. USER ──────────────────────────────────────────────────────────────
  const [user] = await db
    .insert(schema.users)
    .values({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Gabriel',
      email: 'gabriel@dev.local',
      passwordHash: '$2b$10$placeholder_hash_for_dev_only',
    })
    .onConflictDoNothing()
    .returning()

  const userId = user?.id ?? '00000000-0000-0000-0000-000000000001'
  console.log('  ✓ User')

  // ── 2. VOICE PROFILE ─────────────────────────────────────────────────────
  const [voiceProfile] = await db
    .insert(schema.voiceProfiles)
    .values({
      id: '00000000-0000-0000-0000-000000000002',
      userId,
      name: 'Blog técnico',
      toneDescription:
        'Directo, sin florituras. Explica conceptos complejos con analogías concretas. Nunca usa buzzwords vacíos.',
      styleExamples:
        'La mayoría de los problemas de arquitectura no son técnicos, son de incentivos. Si el equipo no tiene razones para mantener el código limpio, no lo hará.',
      intellectualReferences: 'Paul Graham, Joel Spolsky, pragmatismo sobre purismo técnico.',
    })
    .onConflictDoNothing()
    .returning()

  const voiceProfileId = voiceProfile?.id ?? '00000000-0000-0000-0000-000000000002'
  console.log('  ✓ Voice profile')

  // ── 3. KNOWLEDGE SOURCE ──────────────────────────────────────────────────
  const [knowledgeSource] = await db
    .insert(schema.knowledgeSources)
    .values({
      id: '00000000-0000-0000-0000-000000000003',
      userId,
      title: 'El programador pragmático (seed)',
      filePath: '/uploads/seed/pragmatic-programmer.pdf',
      status: 'ready',
    })
    .onConflictDoNothing()
    .returning()

  const sourceId = knowledgeSource?.id ?? '00000000-0000-0000-0000-000000000003'
  console.log('  ✓ Knowledge source')

  // ── 4. KNOWLEDGE CHUNKS (sin embedding — se generan async) ───────────────
  await db
    .insert(schema.knowledgeChunks)
    .values([
      {
        sourceId,
        content:
          'Un programador pragmático no se casa con ninguna tecnología en particular. Usa la herramienta correcta para el trabajo correcto.',
        embedding: null,
        chunkIndex: 0,
      },
      {
        sourceId,
        content:
          "DRY: Don't Repeat Yourself. Cada pieza de conocimiento debe tener una representación única y sin ambigüedades en el sistema.",
        embedding: null,
        chunkIndex: 1,
      },
    ])
    .onConflictDoNothing()

  console.log('  ✓ Knowledge chunks')

  // ── 5. IDEA ───────────────────────────────────────────────────────────────
  const [idea] = await db
    .insert(schema.ideas)
    .values({
      id: '00000000-0000-0000-0000-000000000004',
      userId,
      voiceProfileId,
      title: 'Por qué los monorepos valen la pena',
      content:
        'Los monorepos no son una moda. Son una decisión de ingeniería que resuelve problemas reales de coordinación entre equipos. El principal beneficio no es técnico, es organizacional: todos los cambios quedan atómicos y trazables.',
      mode: 'draft',
      selectedFormats: ['blog', 'instagram'],
    })
    .onConflictDoNothing()
    .returning()

  const ideaId = idea?.id ?? '00000000-0000-0000-0000-000000000004'
  console.log('  ✓ Idea')

  // ── 6. GENERATED CONTENT ─────────────────────────────────────────────────
  await db
    .insert(schema.generatedContents)
    .values([
      {
        ideaId,
        format: 'blog',
        status: 'ready',
        content: {
          title: 'Por qué los monorepos valen la pena (y cuándo no)',
          body: 'Durante años traté los monorepos como una excentricidad de Google y Meta. Empresas con miles de ingenieros que pueden permitirse construir tooling custom. No para un equipo de cinco personas...',
        },
      },
      {
        ideaId,
        format: 'instagram',
        status: 'ready',
        content: {
          caption: 'Los monorepos no son una moda. Son una decisión de ingeniería. 🧵',
          cards: [
            { text: '¿Qué es un monorepo? Todo tu código en un solo repositorio.' },
            { text: 'El beneficio real no es técnico. Es organizacional.' },
            { text: 'Cambios atómicos. Sin romper otros equipos.' },
          ],
        },
      },
    ])
    .onConflictDoNothing()

  console.log('  ✓ Generated content')

  console.log('\n✅ Seed completado.')
  console.log('   User ID:         ', userId)
  console.log('   Voice Profile ID:', voiceProfileId)
  console.log('   Knowledge Source:', sourceId)
  console.log('   Idea ID:         ', ideaId)

  await client.end()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
