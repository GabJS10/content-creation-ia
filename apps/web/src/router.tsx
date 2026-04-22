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

const rootRoute = createRootRouteWithContext<{ session: any }>()({
  component: () => (
    <ThemeProvider defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <nav className="flex items-center gap-6">
              <Link to="/" className="font-medium hover:underline">
                Inicio
              </Link>
              <Link to="/login" className="font-medium hover:underline">
                Login
              </Link>
              <Link to="/register" className="font-medium hover:underline">
                Register
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
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

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, registerRoute])

export const router = createRouter({ routeTree, context: { session: undefined as any } })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
