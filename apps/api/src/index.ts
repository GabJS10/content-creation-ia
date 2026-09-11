process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'
import { authMiddleware } from './middleware/auth'
import { logger } from 'hono/logger'
import { connect as connectRabbitMQ } from './lib/rabbitmq'
import knowledgeRoutes from './routes/knowledge'
import voiceRoutes from './routes/voices'
import ideasRoutes from './routes/ideas'
import generateRoutes from './routes/generate'
import profileRoutes from './routes/profile'
import { startWorker } from './workers/knowledge.worker'
import type { AppVariables } from './types'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use(logger())

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw))

const privateRoutes = new Hono<{ Variables: AppVariables }>()

privateRoutes.use(authMiddleware)

privateRoutes.get('/me', (c) => {
  const user = c.get('user')
  return c.json({ user })
})

app.route('/api/knowledge', knowledgeRoutes)
app.route('/api/voices', voiceRoutes)
app.route('/api/ideas', ideasRoutes)
app.route('/api/generate', generateRoutes)
app.route('/api/profile', profileRoutes)

// Sirve el build del SPA (apps/web/dist) y hace fallback a index.html para el
// enrutado del lado del cliente (TanStack Router). Se resuelve como ruta
// absoluta desde este módulo para que funcione sea cual sea el CWD del proceso.
const webDist = join(dirname(fileURLToPath(import.meta.url)), '../../web/dist')
app.use('/*', serveStatic({ root: webDist }))
app.get('/*', serveStatic({ path: join(webDist, 'index.html') }))

async function start(): Promise<void> {
  await connectRabbitMQ()
  await startWorker()

  serve(
    {
      fetch: app.fetch,
      port: Number(process.env.PORT) || 3000,
    },
    (info) => {
      console.log(`API corriendo en http://localhost:${info.port}`)
    }
  )
}

start()
