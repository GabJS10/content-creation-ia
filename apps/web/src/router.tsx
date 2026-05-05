import {
  createRouter,
  createRootRouteWithContext,
  createRoute,
  Outlet,
  Link,
  redirect,
} from '@tanstack/react-router'
import { ThemeToggle } from './components/theme-toggle'
import { ThemeProvider } from './components/theme-provider'
import { Login } from './routes/login'
import { Register } from './routes/register'
import App from './App'
import { authClient } from './lib/auth-client'
import { DashboardLayout } from './routes/dashboard/layout'
import { KnowledgeSources } from './routes/dashboard/knowledge'
import { Voices } from './routes/dashboard/voices'
import { VoiceNew } from './routes/dashboard/voices/new'
import { VoiceEdit } from './routes/dashboard/voices/$id/edit'
import { Generate } from './routes/dashboard/generate'
import { ContentList } from './routes/dashboard/content'
import { ContentDetail } from './routes/dashboard/content/$ideaId'
import { ContentEditor } from './pages/content/editor'

const rootRoute = createRootRouteWithContext<{ session: any }>()({
  component: () => (
    <ThemeProvider defaultTheme="system" enableSystem>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </ThemeProvider>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async ({ context }) => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({ to: '/login' })
    }
  },
  component: App,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: async ({ context }) => {
    const session = await authClient.getSession()
    if (session.data) {
      throw redirect({ to: '/' })
    }
  },
  component: Login,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  beforeLoad: async ({ context }) => {
    const session = await authClient.getSession()
    if (session.data) {
      throw redirect({ to: '/' })
    }
  },
  component: Register,
})

const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession()
    if (!session) {
      throw redirect({ to: '/login', replace: true })
    }
  },
  component: DashboardLayout,
})

const dashboardIndexRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/knowledge', replace: true })
  },
  component: () => null,
})

const knowledgeRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/knowledge',
  component: KnowledgeSources,
})

const voicesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/voices',
  component: Voices,
})

const voiceNewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/voices/new',
  component: VoiceNew,
})

const voiceEditRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/voices/$id/edit',
  component: VoiceEdit,
})

const generateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/generate',
  component: Generate,
})

const contentRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/content',
  component: ContentList,
})

const contentDetailRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/content/$ideaId',
  component: ContentDetail,
})

const contentEditorRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/content/editor/$contentId',
  component: ContentEditor,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    knowledgeRoute,
    voicesRoute,
    voiceNewRoute,
    voiceEditRoute,
    generateRoute,
    contentRoute,
    contentDetailRoute,
    contentEditorRoute,
  ]),
])

export const router = createRouter({ routeTree, context: { session: undefined as any } })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
