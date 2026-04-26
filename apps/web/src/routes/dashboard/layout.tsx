import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useSession, signOut } from '@/lib/auth-client'
import { ThemeToggle } from '@/components/theme-toggle'
import { BookOpen, Mic, Sparkles, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Knowledge Sources', to: '/dashboard/knowledge', icon: BookOpen },
  { label: 'Perfiles de voz', to: '/dashboard/voices', icon: Mic },
  { label: 'Generación', to: '/dashboard/generate', icon: Sparkles },
]

export function DashboardLayout() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-200',
          isExpanded ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex h-16 items-center border-b border-zinc-800 px-3">
          <div
            className={cn(
              'flex items-center gap-3 transition-all duration-200',
              isExpanded ? 'flex-1' : 'w-full justify-center'
            )}
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex size-10 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              {isExpanded ? (
                <PanelLeftClose className="size-5" />
              ) : (
                <PanelLeftOpen className="size-5" />
              )}
            </button>
            {isExpanded && (
              <span className="text-lg font-semibold text-zinc-50">Content Creation IA</span>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = window.location.pathname === item.to
            const Icon = item.icon
            return (
              <a
                key={item.to}
                href={item.to}
                title={!isExpanded ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isExpanded ? 'gap-3' : 'justify-center',
                  isActive
                    ? 'bg-zinc-800 text-zinc-50'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                )}
              >
                <Icon className="size-5 shrink-0" />
                {isExpanded && <span>{item.label}</span>}
              </a>
            )
          })}
        </nav>

        <div className="border-t border-zinc-800 px-3 py-4">
          {isExpanded ? (
            <>
              <div className="mb-3 px-3">
                <p className="text-sm text-zinc-400">Conectado como</p>
                <p className="truncate text-sm font-medium text-zinc-200">
                  {session?.user?.name || session?.user?.email || 'Usuario'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSignOut}
                  className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="size-4" />
                  Cerrar sesión
                </button>
                <ThemeToggle className="text-zinc-400" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleSignOut}
                title="Cerrar sesión"
                className="flex size-10 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="size-5" />
              </button>
              <ThemeToggle className="text-zinc-400" />
            </div>
          )}
        </div>
      </aside>

      <main className={cn('flex-1 transition-all duration-200', isExpanded ? 'ml-64' : 'ml-16')}>
        <div className="flex h-screen items-center justify-center">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
