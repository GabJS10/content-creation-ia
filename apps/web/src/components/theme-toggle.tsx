'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'

  if (!mounted) {
    return <div className={cn('size-10', className)} />
  }

  return (
    <button
      onClick={() => {
        console.log('click')

        setTheme(isDark ? 'light' : 'dark')
      }}
      className={cn(
        'flex size-10 items-center justify-center rounded-md transition-colors hover:bg-accent',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun
        className={cn(
          'size-5 text-foreground transition-transform duration-300',
          isDark ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
        )}
      />
      <Moon
        className={cn(
          'absolute size-5 text-foreground transition-transform duration-300',
          isDark ? 'scale-0 rotate-90' : 'scale-100 rotate-0'
        )}
      />
    </button>
  )
}
