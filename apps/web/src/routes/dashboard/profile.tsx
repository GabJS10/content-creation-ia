import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface Profile {
  id: string
  name: string
  email: string
  displayName: string | null
  hasApiKey: boolean
}

export function Profile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/profile', { credentials: 'include' })
      if (!res.ok) throw new Error('Error fetching profile')
      return res.json() as Promise<Profile>
    },
  })

  const nameMutation = useMutation({
    mutationFn: async (displayName: string) => {
      const res = await fetch('http://localhost:3000/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      })
      if (!res.ok) throw new Error('Error saving')
      return res.json() as Promise<Profile>
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Profile>(['profile'], data)
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2000)
    },
  })

  const apiKeyMutation = useMutation({
    mutationFn: async (openaiApiKey: string) => {
      const res = await fetch('http://localhost:3000/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiApiKey }),
      })
      if (!res.ok) throw new Error('Error saving')
      return res.json() as Promise<Profile>
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Profile>(['profile'], data)
      setApiKey('')
      setApiKeySaved(true)
      setTimeout(() => setApiKeySaved(false), 2000)
    },
  })

  const hasNameChanged = profile && name !== (profile.displayName || profile.name)
  const isValidApiKey = apiKey.startsWith('sk-')

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-40 bg-zinc-800 rounded animate-pulse" />
          <div className="h-40 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Mi perfil</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gestiona tu información personal y configuración de API
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-200 mb-4">Información personal</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">Nombre</label>
              <Input
                value={name || profile?.displayName || profile?.name || ''}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="bg-zinc-900 border-zinc-700 text-zinc-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">Email</label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-zinc-900/50 border-zinc-700 text-zinc-500"
              />
              <p className="text-xs text-zinc-500 mt-1">El email no se puede cambiar</p>
            </div>
            <Button
              onClick={() => nameMutation.mutate(name)}
              disabled={!hasNameChanged || nameMutation.isPending}
              className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {nameMutation.isPending ? (
                <span className="size-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin mr-2" />
              ) : nameSaved ? (
                <span className="text-green-600 mr-2">✓</span>
              ) : null}
              {nameSaved ? 'Guardado' : 'Guardar cambios'}
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900/50 border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-200 mb-4">API Key de OpenAI</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Tu API key se usa para generar embeddings y contenido. Se guarda de forma encriptada y
            nunca se comparte.
          </p>

          {!profile?.hasApiKey && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
              <AlertTriangle className="size-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-400">
                No tienes una API key configurada. Sin ella no podrás subir documentos ni generar
                contenido.
              </p>
            </div>
          )}

          {profile?.hasApiKey && (
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                API key configurada ✓
              </span>
            </div>
          )}

          {profile?.hasApiKey && (
            <p className="text-xs text-zinc-500 mb-4">Tu key está guardada de forma segura</p>
          )}

          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              {profile?.hasApiKey ? 'Nueva API key' : 'API key'}
            </label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="bg-zinc-900 border-zinc-700 text-zinc-50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300"
              >
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Puedes obtener tu API key en{' '}
              <a
                href="https://platform.openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-300"
              >
                platform.openai.com
              </a>
            </p>
          </div>

          <Button
            onClick={() => apiKeyMutation.mutate(apiKey)}
            disabled={!apiKey || !isValidApiKey || apiKeyMutation.isPending}
            className="mt-4 bg-zinc-50 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {apiKeyMutation.isPending ? (
              <span className="size-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin mr-2" />
            ) : apiKeySaved ? (
              <span className="text-green-600 mr-2">✓</span>
            ) : null}
            {apiKeySaved ? 'Guardada' : 'Guardar API key'}
          </Button>
        </Card>
      </div>
    </div>
  )
}
