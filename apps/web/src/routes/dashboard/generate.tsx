import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Zap, FileText, History, Plus, Trash2, AlertTriangle, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Idea {
  id: string
  title: string
  content: string
  mode: 'quick' | 'draft'
  voiceProfileId: string | null
  selectedFormats: string[]
  createdAt: string
  updatedAt: string
  generatedContents: Array<{ id: string; format: string; status: string }>
}

interface VoiceProfile {
  id: string
  name: string
  toneDescription: string
  styleExamples: string
  intellectualReferences: string
  createdAt: string
}

const FORMAT_LABELS: Record<string, string> = {
  blog: 'Blog',
  instagram: 'Instagram',
  video_script: 'Video',
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function Generate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [ideaId, setIdeaId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'quick' | 'draft'>('quick')
  const [voiceProfileId, setVoiceProfileId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isSaving, setIsSaving] = useState(false)

  const { data: ideas = [], isLoading: isLoadingIdeas } = useQuery({
    queryKey: ['ideas'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/ideas', { credentials: 'include' })
      if (!res.ok) throw new Error('Error fetching ideas')
      return res.json() as Promise<Idea[]>
    },
  })

  const { data: voiceProfiles = [] } = useQuery({
    queryKey: ['voice-profiles'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/voices', { credentials: 'include' })
      if (!res.ok) throw new Error('Error fetching profiles')
      return res.json() as Promise<VoiceProfile[]>
    },
  })

  const createIdeaMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; mode: string }) => {
      const res = await fetch('http://localhost:3000/api/ideas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error creating idea')
      return res.json() as Promise<{ id: string }>
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Idea[]>(['ideas'], (old) => {
        if (!old) return old
        const newIdea: Idea = {
          id: data.id,
          title: content.slice(0, 50) || 'Sin título',
          content,
          mode,
          voiceProfileId,
          selectedFormats: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          generatedContents: [],
        }
        return [newIdea, ...old]
      })
    },
  })

  const updateIdeaMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; mode: string }) => {
      const res = await fetch(`http://localhost:3000/api/ideas/${ideaId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error updating idea')
      return res.json()
    },
  })

  const deleteIdeaMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`http://localhost:3000/api/ideas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Error deleting idea')
      return res.json()
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<Idea[]>(['ideas'], (old) => {
        if (!old) return old
        return old.filter((i) => i.id !== id)
      })
      if (ideaId === id) {
        handleNewIdea()
      }
    },
  })

  const saveIdea = useCallback(async () => {
    if (!content.trim()) return

    const title = content.slice(0, 50) || 'Sin título'
    const data = { title, content, mode }

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      if (!ideaId) {
        const result = await createIdeaMutation.mutateAsync(data)
        setIdeaId(result.id)
      } else {
        await updateIdeaMutation.mutateAsync(data)
      }
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }, [content, mode, ideaId])

  useEffect(() => {
    if (!content.trim()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveIdea()
    }, 1500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [content, mode, saveIdea])

  const handleNewIdea = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIdeaId(null)
    setContent('')
    setMode('quick')
    setVoiceProfileId(null)
    setSaveStatus('idle')
    setIsSaving(false)
  }

  const loadIdeaFromHistory = (idea: Idea) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIdeaId(idea.id)
    setContent(idea.content)
    setMode(idea.mode)
    setVoiceProfileId(idea.voiceProfileId)
    setSaveStatus('idle')
    setIsDrawerOpen(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const sortedIdeas = [...ideas].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return (
    <div className="flex h-full">
      <div className="w-2/5 flex flex-col border-r border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-50">Generar contenido</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <History className="size-4 mr-2" />
              Historial
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewIdea}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Plus className="size-4 mr-2" />
              Nueva idea
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('quick')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                mode === 'quick'
                  ? 'bg-zinc-800 text-zinc-50'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              )}
            >
              <Zap className="size-4" />
              Modo rápido
            </button>
            <button
              onClick={() => setMode('draft')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                mode === 'draft'
                  ? 'bg-zinc-800 text-zinc-50'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              )}
            >
              <FileText className="size-4" />
              Modo borrador
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              {mode === 'quick' ? 'Tu idea' : 'Tu borrador'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={mode === 'quick' ? 4 : 12}
              placeholder={
                mode === 'quick'
                  ? 'Escribe una idea, tema o pregunta...'
                  : 'Escribe tu borrador aquí. Cuanto más detallado, mejor será el resultado...'
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 text-zinc-50 placeholder:text-zinc-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
            <div className="h-5">
              {isSaving && <span className="text-xs text-zinc-500">Guardando...</span>}
              {!isSaving && saveStatus === 'saved' && (
                <span className="text-xs text-green-500">Guardado ✓</span>
              )}
              {!isSaving && saveStatus === 'error' && (
                <span className="text-xs text-red-400">Error al guardar</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Perfil de voz</label>
            <select
              value={voiceProfileId || ''}
              onChange={(e) => setVoiceProfileId(e.target.value || null)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 text-zinc-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="">Sin perfil de voz</option>
              {voiceProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            {!voiceProfileId && (
              <div className="flex items-center gap-2 text-xs text-yellow-500">
                <AlertTriangle className="size-4" />
                <span>
                  Para mejores resultados, selecciona o crea un{' '}
                  <button
                    onClick={() => navigate({ to: '/dashboard/voices/new' })}
                    className="underline hover:text-yellow-400"
                  >
                    perfil de voz
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-3/5 flex items-center justify-center">
        <p className="text-zinc-600">El contenido generado aparecerá aquí</p>
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="left" className="w-80 bg-zinc-900 border-zinc-800 p-0">
          <SheetHeader className="px-4 py-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-zinc-50">Historial de ideas</SheetTitle>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto flex-1">
            {isLoadingIdeas ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : sortedIdeas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className="text-sm text-zinc-500">No hay ideas todavía</p>
              </div>
            ) : (
              <div className="p-2">
                {sortedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="group flex items-start gap-2 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
                    onClick={() => loadIdeaFromHistory(idea)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{idea.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatDate(idea.updatedAt)}</p>
                      {idea.selectedFormats.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {idea.selectedFormats.map((f) => (
                            <span
                              key={f}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400"
                            >
                              {FORMAT_LABELS[f] || f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('¿Eliminar esta idea?')) {
                          deleteIdeaMutation.mutate(idea.id)
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
