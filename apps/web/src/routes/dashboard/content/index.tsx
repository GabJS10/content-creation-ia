import { useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, FileText, Trash2, LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GeneratedContent {
  id: string
  format: 'blog' | 'instagram' | 'video_script'
  status: 'generating' | 'ready' | 'edited'
  updatedAt: string
}

interface Idea {
  id: string
  title: string
  content: string
  mode: 'quick' | 'draft'
  voiceProfileId: string | null
  selectedFormats: string[]
  createdAt: string
  updatedAt: string
  generatedContents: GeneratedContent[]
}

const FORMAT_LABELS: Record<string, string> = {
  blog: 'Blog',
  instagram: 'Instagram',
  video_script: 'Video',
}

export function ContentList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ['ideas'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/ideas', { credentials: 'include' })
      if (!res.ok) throw new Error('Error fetching ideas')
      return res.json() as Promise<Idea[]>
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`http://localhost:3000/api/ideas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Error deleting idea')
      return res.json() as Promise<{ success: boolean }>
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<Idea[]>(['ideas'], (old) => {
        if (!old) return old
        return old.filter((i) => i.id !== id)
      })
    },
  })

  const ideasWithContent = ideas.filter((idea) =>
    idea.generatedContents.some((gc) => gc.status === 'ready' || gc.status === 'edited')
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getReadyFormats = (idea: Idea) =>
    idea.generatedContents
      .filter((gc) => gc.status === 'ready' || gc.status === 'edited')
      .map((gc) => gc.format)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Tu contenido</h1>
        <p className="text-sm text-zinc-500 mt-1">Ideas que ya tienen contenido generado</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : ideasWithContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LayoutList className="size-12 text-zinc-600 mb-4" />
          <p className="text-zinc-300 font-medium">No tienes contenido generado todavía</p>
          <p className="text-sm text-zinc-500 mt-1">Ve al generador para crear tu primer contenido</p>
          <Button
            onClick={() => navigate({ to: '/dashboard/generate' })}
            className="mt-4 bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
          >
            Ir al generador
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {ideasWithContent.map((idea) => {
            const Icon = idea.mode === 'quick' ? Zap : FileText
            const readyFormats = getReadyFormats(idea)

            return (
              <div
                key={idea.id}
                onClick={() => navigate({ to: `/dashboard/content/${idea.id}` })}
                className="flex items-center gap-4 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <Icon className="size-5 text-zinc-400 shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-zinc-50 font-medium truncate">{idea.title}</p>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                    idea.mode === 'quick'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {idea.mode === 'quick' ? 'Rápido' : 'Borrador'}
                </span>

                <span className="text-sm text-zinc-500 shrink-0">{formatDate(idea.updatedAt)}</span>

                <div className="flex gap-1.5 shrink-0">
                  {readyFormats.map((format) => (
                    <span
                      key={format}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400"
                    >
                      {FORMAT_LABELS[format]}
                    </span>
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('¿Eliminar esta idea y todo su contenido?')) {
                      deleteMutation.mutate(idea.id)
                    }
                  }}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}