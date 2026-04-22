import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'
const app = new Hono()

app.use(
  '*',
  cors({
    origin: 'http://localhost:5173',
  })
)

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw))

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`API corriendo en http://localhost:${info.port}`)
  }
)
