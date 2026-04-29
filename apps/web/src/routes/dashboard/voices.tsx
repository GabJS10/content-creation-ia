import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

interface VoiceProfile {
  id: string
  name: string
  toneDescription: string
  styleExamples: string
  intellectualReferences: string
  createdAt: string
}

export function Voices() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['voice-profiles'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/voices')
      if (!res.ok) throw new Error('Error fetching profiles')
      return res.json() as Promise<VoiceProfile[]>
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`http://localhost:3000/api/voices/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      return res.json()
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<VoiceProfile[]>(['voice-profiles'], (old) => {
        if (!old) return old
        return old.filter((p) => p.id !== id)
      })
    },
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Perfiles de voz</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configura cómo quieres que suene tu contenido
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: '/dashboard/voices/new' })}
          className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
        >
          <Plus className="size-4 mr-2" />
          Nuevo perfil
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4">
                <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-zinc-800 rounded animate-pulse mb-1" />
                <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse mb-3" />
                <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
              </CardContent>
              <CardFooter className="gap-2">
                <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
                <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Mic className="size-16 text-zinc-600 mb-4" />
          <p className="text-lg text-zinc-400 mb-1">No tienes perfiles de voz todavía</p>
          <p className="text-sm text-zinc-500 mb-6">Crea tu primer perfil para empezar</p>
          <Button
            onClick={() => navigate({ to: '/dashboard/voices/new' })}
            className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
          >
            Crear tu primer perfil
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="bg-zinc-900 border-zinc-800 flex flex-col">
              <CardContent className="pt-4 flex-1">
                <h3 className="text-lg font-bold text-zinc-50 mb-2">{profile.name}</h3>
                <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{profile.toneDescription}</p>
                <p className="text-xs text-zinc-600">{formatDate(profile.createdAt)}</p>
              </CardContent>
              <CardFooter className="gap-2 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: `/dashboard/voices/${profile.id}/edit` })}
                  className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <Pencil className="size-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('¿Eliminar este perfil?')) {
                      deleteMutation.mutate(profile.id)
                    }
                  }}
                  className="border-zinc-700 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
