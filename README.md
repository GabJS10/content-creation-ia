# Content Creation IA

Plataforma de creación de contenido asistida por inteligencia artificial. Genera blogs, carruseles de Instagram y guiones de video a partir de ideas, usando fuentes de conocimiento propias (PDFs) y perfiles de voz personalizados.

🔗 **Producción:** https://app-production-66be.up.railway.app

## Stack

| Capa | Tecnología |
|------|------------|
| **Monorepo** | pnpm workspace + Turborepo |
| **Backend** | Hono + Node.js (TypeScript ESM, ejecutado con `tsx`) |
| **Frontend** | React 19 + Vite + TypeScript |
| **Base de datos** | Neon PostgreSQL + Drizzle ORM |
| **Autenticación** | better-auth (email/contraseña) |
| **Colas** | RabbitMQ (procesamiento de PDFs) |
| **Tiempo real** | Redis pub/sub + SSE |
| **IA** | OpenAI GPT-4.1 + text-embedding-3-small |
| **Estilos** | Tailwind CSS + shadcn/ui |
| **Editor** | TipTap (ProseMirror) |
| **Hosting** | Railway (single-domain) |

## Estructura

```
apps/
  api/          # Backend Hono (puerto 3000 en local; en prod sirve también el SPA)
  web/          # Frontend React + Vite (puerto 5173 en local)
packages/
  types/        # Tipos compartidos (User, Idea, GeneratedContent...)
```

## Arquitectura

En **producción** la API de Hono sirve tanto los endpoints `/api/*` como el build estático del
SPA (`apps/web/dist`), todo bajo **un único dominio**. Esto evita CORS y hace que la cookie de
sesión sea de primer nivel (same-origin). El worker de RabbitMQ corre *in-process* dentro de la
misma API.

En **desarrollo local** son dos procesos: el frontend en Vite (`:5173`) llama a la API (`:3000`) a
través de `VITE_API_URL`.

```
Producción (Railway)                 Local (pnpm dev)
────────────────────                 ────────────────
app.up.railway.app                   web  :5173  ──VITE_API_URL──▶  api :3000
  ├── /        → SPA (dist)          Docker: RabbitMQ :5672 · Redis :6379
  └── /api/*   → Hono + worker       DB: Neon (externo)
Redis + RabbitMQ (red privada)
DB: Neon (externo)
```

## Requisitos

- Node.js >= 18 (producción usa Node 22)
- pnpm
- Docker (para RabbitMQ y Redis en local)

## Inicio rápido

```bash
# Instalar dependencias
pnpm install

# Iniciar servicios (RabbitMQ + Redis)
docker compose up -d

# Configurar variables de entorno
cp .env.example apps/api/.env   # Completar DATABASE_URL, OPENAI_API_KEY, etc.
# El frontend lee VITE_API_URL desde apps/web/.env (por defecto http://localhost:3000)

# Ejecutar migraciones
pnpm --filter @content-creation-ia/api db:migrate

# Iniciar desarrollo (API + web en paralelo)
pnpm dev
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia API (`tsx watch`) y web (Vite) en paralelo |
| `pnpm build` | Genera el build de producción del web (`apps/web/dist`); la API no se compila (corre con `tsx`) |
| `pnpm lint` | TypeScript check por paquete |
| `pnpm format` | Formatea código con Prettier |

Ejecutar un solo paquete: `pnpm --filter @content-creation-ia/api dev`

## Funcionalidades

- **Fuentes de conocimiento**: Sube PDFs → extracción de texto → chunking → embeddings → búsqueda semántica
- **Perfiles de voz**: Configura el tono, estilo y referencias para la generación de contenido
- **Ideas**: Crea briefs de contenido en modo rápido (con RAG) o borrador (texto libre)
- **Generación**: Selecciona formato (blog, Instagram, guion de video) y obtén contenido generado por GPT-4.1 con streaming SSE
- **Edición**: Editor enriquecido para blogs (TipTap), editor de carruseles con contador de caracteres y editor de guiones con secciones
- **Perfil**: Gestiona tu clave de OpenAI (almacenada cifrada con AES-256-GCM)

## API endpoints

| Ruta | Descripción |
|------|-------------|
| `GET /health` | Health check |
| `POST /api/knowledge/upload` | Subir PDF |
| `GET /api/knowledge` | Listar fuentes de conocimiento |
| `GET /api/knowledge/:id/stream` | SSE de progreso de procesamiento |
| `GET/POST/PUT/DELETE /api/voices` | CRUD de perfiles de voz |
| `GET/POST/PUT/DELETE /api/ideas` | CRUD de ideas |
| `POST /api/generate` | Generar contenido (SSE) |
| `PUT /api/generate/:id` | Editar contenido generado |
| `GET/PUT /api/profile` | Perfil de usuario |
| `GET/POST /api/auth/**` | Autenticación (better-auth) |

## Variables de entorno

| Variable | Descripción | Ámbito |
|----------|-------------|--------|
| `DATABASE_URL` | Conexión a Neon PostgreSQL | API |
| `RABBITMQ_URL` | Conexión a RabbitMQ (`amqp://admin:admin@localhost:5672` en local) | API |
| `REDIS_URL` | Conexión a Redis (`redis://localhost:6379` en local) | API |
| `OPENAI_API_KEY` | API key de OpenAI (fallback; cada usuario puede guardar la suya cifrada) | API |
| `ENCRYPTION_KEY` | Clave AES-256-GCM (32 bytes hex) para cifrar las API keys de usuarios | API |
| `BETTER_AUTH_SECRET` | Secreto de sesiones de better-auth | API |
| `BETTER_AUTH_URL` | URL base pública (usada como `baseURL` y `trustedOrigin`) | API |
| `WEB_ORIGIN` | Origen permitido por CORS (solo relevante si web y API están en dominios distintos) | API |
| `VITE_API_URL` | URL base de la API (build-time de Vite) | Web |

Ver [`.env.example`](.env.example) para la plantilla completa.

## Despliegue en Railway

El proyecto está desplegado en Railway como **un solo servicio de aplicación** (`app`) que sirve la
API y el SPA, más **Redis** y **RabbitMQ** en la red privada. La base de datos es **Neon** (externa).

**Configuración del servicio `app`:**

| Ajuste | Valor |
|--------|-------|
| Build command | `pnpm --filter @content-creation-ia/web build` |
| Start command | `pnpm --filter @content-creation-ia/api start` (arranca con `tsx`) |
| Healthcheck | `/health` |
| Restart policy | `ON_FAILURE` (10 reintentos) |

Redis y RabbitMQ se referencian por red privada:

```
REDIS_URL    = ${{Redis.REDIS_URL}}
RABBITMQ_URL = amqp://${{rabbitmq.RABBITMQ_DEFAULT_USER}}:${{rabbitmq.RABBITMQ_DEFAULT_PASS}}@${{rabbitmq.RAILWAY_PRIVATE_DOMAIN}}:5672
```

> **Nota:** `ioredis` usa `family: 0` para poder resolver los hosts `*.railway.internal`
> (red privada solo IPv6 de Railway).

**CI/CD:** el servicio está conectado a este repositorio en la rama **`main`**. Cada `git push` a
`main` reconstruye y redespliega automáticamente.

Despliegue manual desde local (opcional): `railway up --service app`.
