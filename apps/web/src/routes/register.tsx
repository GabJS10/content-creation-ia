import { Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { signUp } from '../lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, Loader2, Bot } from 'lucide-react'

export function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    document.body.classList.add('dark')
  }, [])

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password) {
      setError('Todos los campos son requeridos')
      return
    }

    if (!isValidEmail(email)) {
      setError('Email con formato inválido')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await signUp.email({ email, password, name })
      if (error) {
        setError(error.message || 'Error al registrar')
      } else {
        navigate({ to: '/' })
      }
    } catch {
      setError('Error al registrar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1b1b1b] px-4">
      <Card className="w-full max-w-[400px] border-border/40 bg-zinc-900 shadow-2xl">
        <CardHeader className="flex flex-col items-center gap-3 pb-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
            <Bot className="size-7 text-zinc-300" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-50">
            Crear cuenta
          </CardTitle>
          <CardDescription className="text-sm text-zinc-400">
            Completa tus datos para registrarte
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-sm font-medium text-zinc-300">
                Nombre completo
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-11 border-zinc-700 bg-zinc-800 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-700"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-300">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 border-zinc-700 bg-zinc-800 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-700"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 border-zinc-700 bg-zinc-800 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-700"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full gap-2 bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
            >
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-1 pt-2 text-center">
          <p className="text-sm text-zinc-400">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="font-medium text-zinc-300 underline-offset-4 transition-colors hover:text-zinc-50 hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}