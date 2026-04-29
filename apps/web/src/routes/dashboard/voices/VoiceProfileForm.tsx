import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VoiceProfileFormProps {
  profileId?: string
}

interface VoiceProfile {
  id: string
  name: string
  toneDescription: string
  styleExamples: string
  intellectualReferences: string
  createdAt: string
}

export function VoiceProfileForm({ profileId }: VoiceProfileFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [toneDescription, setToneDescription] = useState('')
  const [styleExamples, setStyleExamples] = useState('')
  const [intellectualReferences, setIntellectualReferences] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isEditing = !!profileId

  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: loadError,
  } = useQuery({
    queryKey: ['voice-profile', profileId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/api/voices/${profileId}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 404) throw new Error('Perfil no encontrado')
        throw new Error('Error al cargar el perfil')
      }
      return res.json() as Promise<VoiceProfile>
    },
    enabled: isEditing,
  })

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setToneDescription(profile.toneDescription)
      setStyleExamples(profile.styleExamples)
      setIntellectualReferences(profile.intellectualReferences)
    }
  }, [profile])

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('http://localhost:3000/api/voices', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, toneDescription, styleExamples, intellectualReferences }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Error al crear el perfil')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-profiles'] })
      navigate({ to: '/dashboard/voices' })
    },
    onError: (err: Error) => {
      setSubmitError(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:3000/api/voices/${profileId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, toneDescription, styleExamples, intellectualReferences }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Error al actualizar el perfil')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['voice-profile', profileId] })
      navigate({ to: '/dashboard/voices' })
    },
    onError: (err: Error) => {
      setSubmitError(err.message)
    },
  })

  const isMutating = createMutation.isPending || updateMutation.isPending

  const handleSubmit = () => {
    setSubmitError(null)
    if (isEditing) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const isFormValid =
    name.trim() && toneDescription.trim() && styleExamples.trim() && intellectualReferences.trim()

  if (isLoadingProfile) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse mb-6" />
        <div className="h-8 w-40 bg-zinc-800 rounded animate-pulse mb-8" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loadError && isEditing) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate({ to: '/dashboard/voices' })}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-6 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver a perfiles
        </button>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-zinc-400 mb-4">{(loadError as Error).message}</p>
          <Button
            onClick={() => navigate({ to: '/dashboard/voices' })}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Volver al listado
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate({ to: '/dashboard/voices' })}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-zinc-50">
          {isEditing ? 'Editar perfil' : 'Nuevo perfil'}
        </h1>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isMutating}
          className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {isMutating && <Loader2 className="size-4 mr-2 animate-spin" />}
          {isMutating ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-300">
            Nombre del perfil
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Divulgador científico, Coach motivacional..."
            className="bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toneDescription" className="text-zinc-300">
            Tono y personalidad
          </Label>
          <textarea
            id="toneDescription"
            value={toneDescription}
            onChange={(e) => setToneDescription(e.target.value)}
            rows={4}
            placeholder="Describe cómo suenas: tu nivel de formalidad, energía, cercanía con el lector. Ej. Soy directo y conversacional, uso humor ocasional, evito el lenguaje corporativo..."
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 text-zinc-50 placeholder:text-zinc-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="styleExamples" className="text-zinc-300">
            Ejemplos de estilo
          </Label>
          <textarea
            id="styleExamples"
            value={styleExamples}
            onChange={(e) => setStyleExamples(e.target.value)}
            rows={6}
            placeholder="Pega aquí fragmentos de textos que hayas escrito o que representen cómo quieres sonar. Cuantos más ejemplos, mejor calibrado estará el modelo..."
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 text-zinc-50 placeholder:text-zinc-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="intellectualReferences" className="text-zinc-300">
            Referencias intelectuales
          </Label>
          <textarea
            id="intellectualReferences"
            value={intellectualReferences}
            onChange={(e) => setIntellectualReferences(e.target.value)}
            rows={4}
            placeholder="Autores, pensadores, creadores o libros que influyen en tu forma de comunicar. Ej. Paul Graham, Richard Feynman, el estilo de Lex Fridman..."
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 text-zinc-50 placeholder:text-zinc-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
          />
        </div>

        {submitError && <p className="text-sm text-red-400">{submitError}</p>}
      </div>
    </div>
  )
}
