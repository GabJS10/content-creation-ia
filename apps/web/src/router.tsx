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
import { Generate } from './routes/dashboard/generate'

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

const generateRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/generate',
  component: Generate,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardLayoutRoute.addChildren([
    dashboardIndexRoute,
    knowledgeRoute,
    voicesRoute,
    generateRoute,
  ]),
])

export const router = createRouter({ routeTree, context: { session: undefined as any } })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
