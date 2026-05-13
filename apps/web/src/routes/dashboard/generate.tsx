import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Zap, FileText, History, Plus, Trash2, AlertTriangle, X,
  FileText as FileTextIcon, Image, Video, Sparkles, ChevronDown, ChevronRight,
  Loader2,
} from 'lucide-react'
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

interface KnowledgeSource {
  id: string
  title: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  chunks_count: number | null
}

interface BlogOptions {
  length: 'short' | 'medium' | 'long'
  tone: 'informativo' | 'opinion' | 'tutorial'
}

interface InstagramOptions {
  slides: 'short' | 'extended'
  slideLength: 'short' | 'medium'
}

interface VideoScriptOptions {
  duration: '60s' | '3min' | '5min'
  style: 'educativo' | 'storytelling' | 'opinion'
}

interface FormatState {
  selected: boolean
  options: BlogOptions | InstagramOptions | VideoScriptOptions
}

interface StreamingContent {
  contentId: string
  text: string
  done: boolean
  error?: string
}

interface StreamingContents {
  blog?: StreamingContent
  instagram?: StreamingContent
  video_script?: StreamingContent
}

const FORMAT_LABELS: Record<string, string> = {
  blog: 'Blog',
  instagram: 'Instagram',
  video_script: 'Video Script',
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const defaultFormatStates: Record<string, FormatState> = {
  blog: { selected: false, options: { length: 'medium', tone: 'informativo' } as BlogOptions },
  instagram: { selected: false, options: { slides: 'short', slideLength: 'short' } as InstagramOptions },
  video_script: { selected: false, options: { duration: '60s', style: 'educativo' } as VideoScriptOptions },
}

export function Generate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [ideaId, setIdeaId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'quick' | 'draft'>('quick')
  const [voiceProfileId, setVoiceProfileId] = useState<string | null>(null)
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [formatStates, setFormatStates] = useState<Record<string, FormatState>>(defaultFormatStates)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingFormat, setGeneratingFormat] = useState<string | null>(null)
  const [streamingContents, setStreamingContents] = useState<StreamingContents>({})
  const [generationError, setGenerationError] = useState<string | null>(null)

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

  const { data: knowledgeSources = [] } = useQuery({
    queryKey: ['knowledge-sources'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/knowledge', { credentials: 'include' })
      if (!res.ok) throw new Error('Error fetching sources')
      return res.json() as Promise<KnowledgeSource[]>
    },
  })

  const readySources = knowledgeSources.filter((s) => s.status === 'ready')

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/profile', { credentials: 'include' })
      if (!res.ok) throw new Error('Error fetching profile')
      return res.json() as Promise<{ hasApiKey: boolean }>
    },
    staleTime: 5 * 60 * 1000,
  })

  const createIdeaMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; mode: string; voiceProfileId?: string | null }) => {
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
    mutationFn: async (data: { title: string; content: string; mode: string; voiceProfileId?: string | null; selectedFormats?: string[] }) => {
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
    const data = { title, content, mode, voiceProfileId }

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
  }, [content, mode, ideaId, voiceProfileId])

  useEffect(() => {
    if (!content.trim()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveIdea()
    }, 1500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [content, mode, saveIdea, voiceProfileId])

  const handleModeChange = (newMode: 'quick' | 'draft') => {
    setMode(newMode)
    setSelectedSourceIds([])
  }

  const handleNewIdea = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIdeaId(null)
    setContent('')
    setMode('quick')
    setVoiceProfileId(null)
    setSelectedSourceIds([])
    setFormatStates(defaultFormatStates)
    setSaveStatus('idle')
    setIsSaving(false)
  }

  const loadIdeaFromHistory = (idea: Idea) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIdeaId(idea.id)
    setContent(idea.content)
    setMode(idea.mode)
    setVoiceProfileId(idea.voiceProfileId)
    setSelectedSourceIds([])
    setFormatStates(defaultFormatStates)
    setSaveStatus('idle')
    setIsDrawerOpen(false)
  }

  const toggleSource = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const toggleFormat = (format: string) => {
    setFormatStates((prev) => ({
      ...prev,
      [format]: {
        ...prev[format],
        selected: !prev[format].selected,
      },
    }))
  }

  const updateBlogOption = (key: keyof BlogOptions, value: BlogOptions[keyof BlogOptions]) => {
    setFormatStates((prev) => ({
      ...prev,
      blog: {
        ...prev.blog,
        options: { ...prev.blog.options, [key]: value },
      },
    }))
  }

  const updateInstagramOption = (key: keyof InstagramOptions, value: InstagramOptions[keyof InstagramOptions]) => {
    setFormatStates((prev) => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        options: { ...prev.instagram.options, [key]: value },
      },
    }))
  }

  const updateVideoScriptOption = (key: keyof VideoScriptOptions, value: VideoScriptOptions[keyof VideoScriptOptions]) => {
    setFormatStates((prev) => ({
      ...prev,
      video_script: {
        ...prev.video_script,
        options: { ...prev.video_script.options, [key]: value },
      },
    }))
  }

  const handleGenerate = async () => {
    const activeFormats = Object.entries(formatStates)
      .filter(([, state]) => state.selected)
      .map(([format]) => format)

    if (activeFormats.length === 0) return

    const formatOptions: Record<string, object> = {}
    for (const format of activeFormats) {
      formatOptions[format] = formatStates[format].options
    }

    const payload = {
      ideaId,
      formats: activeFormats,
      formatOptions,
      sourceIds: mode === 'quick' ? selectedSourceIds : [],
    }

    if (ideaId) {
      queryClient.setQueryData<Idea[]>(['ideas'], (old) => {
        if (!old) return old
        return old.map((i) =>
          i.id === ideaId
            ? { ...i, selectedFormats: activeFormats, voiceProfileId }
            : i
        )
      })
    }

    setIsGenerating(true)
    setGeneratingFormat(null)
    setStreamingContents({})
    setGenerationError(null)

    try {
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              handleSSEEvent(event)
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      if (buffer.startsWith('data: ')) {
        try {
          const event = JSON.parse(buffer.slice(6))
          handleSSEEvent(event)
        } catch {
          // ignore parse errors
        }
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Error de red')
      setIsGenerating(false)
      setGeneratingFormat(null)
    }
  }

  const handleSSEEvent = (event: Record<string, unknown>) => {
    if (event.status === 'complete') {
      setIsGenerating(false)
      setGeneratingFormat(null)
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      return
    }

    const format = event.format as string
    const status = event.status as string

    if (!['blog', 'instagram', 'video_script'].includes(format)) return

    if (status === 'starting') {
      setGeneratingFormat(format)
      setStreamingContents((prev) => ({
        ...prev,
        [format]: {
          contentId: event.contentId as string,
          text: '',
          done: false,
        },
      }))
    } else if (status === 'streaming') {
      const chunk = event.chunk as string
      setStreamingContents((prev) => {
        const current = prev[format as keyof StreamingContents]
        return {
          ...prev,
          [format]: {
            ...current!,
            text: current!.text + chunk,
          },
        }
      })
    } else if (status === 'done') {
      setStreamingContents((prev) => {
        const current = prev[format as keyof StreamingContents]
        return {
          ...prev,
          [format]: {
            ...current!,
            done: true,
          },
        }
      })
      setGeneratingFormat(null)
    } else if (status === 'error') {
      setStreamingContents((prev) => {
        const current = prev[format as keyof StreamingContents]
        return {
          ...prev,
          [format]: {
            ...current!,
            done: true,
            error: event.message as string,
          },
        }
      })
      setGeneratingFormat(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const sortedIdeas = [...ideas].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  const activeFormats = Object.entries(formatStates).filter(([, s]) => s.selected)
  const canGenerate =
    content.trim() &&
    activeFormats.length > 0 &&
    (mode === 'draft' || selectedSourceIds.length > 0) &&
    profile?.hasApiKey

  const blogOptions = formatStates.blog.options as BlogOptions
  const instagramOptions = formatStates.instagram.options as InstagramOptions
  const videoScriptOptions = formatStates.video_script.options as VideoScriptOptions

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
              Nuevo
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!profile?.hasApiKey && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="size-4 text-yellow-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-400">
                  Necesitas configurar tu OpenAI API key para generar contenido.
                </p>
                <button
                  onClick={() => navigate({ to: '/dashboard/profile' })}
                  className="text-sm text-yellow-400 underline hover:text-yellow-300 mt-1"
                >
                  Ir a Mi perfil
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleModeChange('quick')}
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
              onClick={() => handleModeChange('draft')}
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              Documentos de conocimiento
              {mode === 'quick' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                  Requerido
                </span>
              )}
            </label>
            {readySources.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-yellow-500 p-3 rounded bg-yellow-500/10">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  No tienes documentos procesados.{' '}
                  <button
                    onClick={() => navigate({ to: '/dashboard/knowledge' })}
                    className="underline hover:text-yellow-400"
                  >
                    Sube documentos
                  </button>{' '}
                  en la sección Knowledge Sources
                </span>
              </div>
            ) : (
              <>
                {mode === 'draft' && (
                  <p className="text-xs text-zinc-500">
                    Opcional. Enriquece tu borrador con tus documentos de conocimiento.
                  </p>
                )}
                <div className="space-y-2 border border-zinc-800 rounded-lg p-3">
                  {readySources.map((source) => (
                    <label
                      key={source.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/30 p-1.5 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSourceIds.includes(source.id)}
                        onChange={() => toggleSource(source.id)}
                        className="size-4 rounded border-zinc-600 bg-zinc-800 text-zinc-50 focus:ring-zinc-500"
                      />
                      <FileTextIcon className="size-4 text-zinc-500 shrink-0" />
                      <span className="text-sm text-zinc-200 flex-1">{source.title}</span>
                      <span className="text-xs text-zinc-500">
                        {source.chunks_count} fragmentos
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">Formatos a generar</label>
            <p className="text-xs text-zinc-500">Selecciona uno o más formatos</p>

            <div className="space-y-2">
              {(['blog', 'instagram', 'video_script'] as const).map((format) => {
                const state = formatStates[format]
                const icons = {
                  blog: FileTextIcon,
                  instagram: Image,
                  video_script: Video,
                }
                const Icon = icons[format]

                return (
                  <div key={format} className="border border-zinc-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFormat(format)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800/30 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={() => toggleFormat(format)}
                        className="size-4 rounded border-zinc-600 bg-zinc-800 text-zinc-50 focus:ring-zinc-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Icon className="size-4 text-zinc-400" />
                      <span className="text-sm text-zinc-200 flex-1 text-left">
                        {FORMAT_LABELS[format]}
                      </span>
                      {state.selected ? (
                        <ChevronDown className="size-4 text-zinc-400" />
                      ) : (
                        <ChevronRight className="size-4 text-zinc-400" />
                      )}
                    </button>

                    {state.selected && format === 'blog' && (
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-800 space-y-3">
                        <div className="space-y-1">
                          <span className="text-xs text-zinc-500">Longitud</span>
                          <div className="flex gap-1">
                            {(['short', 'medium', 'long'] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => updateBlogOption('length', opt)}
                                className={cn(
                                  'flex-1 px-2 py-1.5 rounded text-xs transition-colors',
                                  blogOptions.length === opt
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/50'
                                )}
                              >
                                {opt === 'short' ? 'Corto ~500' : opt === 'medium' ? 'Medio ~1000' : 'Largo ~1500'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-zinc-500">Tono</span>
                          <div className="flex gap-1">
                            {(['informativo', 'opinion', 'tutorial'] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => updateBlogOption('tone', opt)}
                                className={cn(
                                  'flex-1 px-2 py-1.5 rounded text-xs transition-colors capitalize',
                                  blogOptions.tone === opt
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/50'
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {state.selected && format === 'instagram' && (
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-800 space-y-3">
                        <div className="space-y-1">
                          <span className="text-xs text-zinc-500">Slides</span>
                          <div className="flex gap-1">
                            {(['short', 'extended'] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => updateInstagramOption('slides', opt)}
                                className={cn(
                                  'flex-1 px-2 py-1.5 rounded text-xs transition-colors',
                                  instagramOptions.slides === opt
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/50'
                                )}
                              >
                                {opt === 'short' ? 'Corto (3-4)' : 'Ampliado (6-8)'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-zinc-500">Longitud por slide</span>
                          <div className="flex gap-1">
                            {(['short', 'medium'] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => updateInstagramOption('slideLength', opt)}
                                className={cn(
                                  'flex-1 px-2 py-1.5 rounded text-xs transition-colors',
                                  instagramOptions.slideLength === opt
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/50'
                                )}
                              >
                                {opt === 'short' ? 'Corto (2 líneas)' : 'Medio (4 líneas)'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {state.selected && format === 'video_script' && (
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-800 space-y-3">
                        <div className="space-y-1">
                          <span className="text-xs text-zinc-500">Duración</span>
                          <div className="flex gap-1">
                            {(['60s', '3min', '5min'] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => updateVideoScriptOption('duration', opt)}
                                className={cn(
                                  'flex-1 px-2 py-1.5 rounded text-xs transition-colors',
                                  videoScriptOptions.duration === opt
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/50'
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-zinc-500">Estilo</span>
                          <div className="flex gap-1">
                            {(['educativo', 'storytelling', 'opinion'] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => updateVideoScriptOption('style', opt)}
                                className={cn(
                                  'flex-1 px-2 py-1.5 rounded text-xs transition-colors capitalize',
                                  videoScriptOptions.style === opt
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/50'
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full bg-zinc-50 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 h-12 text-base"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-5 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="size-5 mr-2" />
                Generar contenido
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="w-3/5 flex flex-col">
        {generationError && (
          <div className="p-4 m-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">Error: {generationError}</p>
          </div>
        )}

        {!isGenerating && Object.keys(streamingContents).length === 0 && !generationError && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Sparkles className="size-12 text-zinc-600 mb-4" />
            <p className="text-zinc-600">El contenido generado aparecerá aquí</p>
          </div>
        )}

        {(isGenerating || Object.keys(streamingContents).length > 0) && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(['blog', 'instagram', 'video_script'] as const).map((format) => {
              const content = streamingContents[format]
              if (!content && !isGenerating) return null

              const icons = {
                blog: FileTextIcon,
                instagram: Image,
                video_script: Video,
              }
              const Icon = icons[format]
              const isActive = generatingFormat === format
              const hasContent = !!content

              if (!hasContent && !isGenerating) return null

              return (
                <div key={format} className="border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50">
                    <Icon className="size-4 text-zinc-400" />
                    <span className="text-sm text-zinc-200 flex-1">{FORMAT_LABELS[format]}</span>
                    {content?.done && !content.error && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                        Listo
                      </span>
                    )}
                    {content?.error && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                        Error
                      </span>
                    )}
                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                        <Loader2 className="size-3 animate-spin" />
                        Generando...
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-zinc-900/50">
                    {content?.error ? (
                      <p className="text-sm text-red-400">{content.error}</p>
                    ) : content?.text ? (
                      <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                        {content.text}
                        {!content.done && <span className="animate-pulse">▋</span>}
                      </pre>
                    ) : (
                      <p className="text-xs text-zinc-600 italic">Esperando contenido...</p>
                    )}
                  </div>
                </div>
              )
            })}

            {!isGenerating && Object.keys(streamingContents).length > 0 && !generationError && (
              <div className="pt-4 flex justify-center">
                <Button
                  onClick={() => navigate({ to: `/dashboard/content/${ideaId}` })}
                  className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                >
                  Ver editores
                </Button>
              </div>
            )}
          </div>
        )}
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