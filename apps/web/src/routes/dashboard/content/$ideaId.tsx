import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BlogContent {
  title: string
  body: string
}

interface InstagramContent {
  caption: string
  cards: Array<{ text: string }>
}

interface VideoScriptContent {
  script: string
}

interface GeneratedContent {
  id: string
  format: 'blog' | 'instagram' | 'video_script'
  status: 'generating' | 'ready' | 'edited'
  content: BlogContent | InstagramContent | VideoScriptContent
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
  video_script: 'Video Script',
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

interface ContentCardProps {
  content: GeneratedContent
  onEdit: () => void
  onDelete: () => void
}

function BlogCard({ content, onEdit, onDelete }: ContentCardProps) {
  const blogContent = content.content as BlogContent
  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800">
      <h3 className="text-xl font-bold text-zinc-50 mb-3">{blogContent.title}</h3>
      <p className="text-zinc-400 mb-4 leading-relaxed">{truncate(blogContent.body, 300)}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              content.status === 'ready'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {content.status === 'ready' ? 'Listo' : 'Editado'}
          </span>
          <span className="text-xs text-zinc-500">{formatDate(content.updatedAt)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Pencil className="size-4 mr-1" />
            Editar
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
          >
            <Trash2 className="size-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  )
}

function InstagramCard({ content, onEdit, onDelete }: ContentCardProps) {
  const instagramContent = content.content as InstagramContent
  const previewSlides = instagramContent.cards.slice(0, 2)
  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800">
      <p className="text-zinc-400 italic mb-3">{instagramContent.caption}</p>
      <p className="text-sm text-zinc-500 mb-4">{instagramContent.cards.length} slides</p>
      <div className="flex gap-2 mb-4">
        {previewSlides.map((slide, i) => (
          <span
            key={i}
            className="inline-flex items-center px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 text-xs"
          >
            {truncate(slide.text, 60)}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              content.status === 'ready'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {content.status === 'ready' ? 'Listo' : 'Editado'}
          </span>
          <span className="text-xs text-zinc-500">{formatDate(content.updatedAt)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Pencil className="size-4 mr-1" />
            Editar
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
          >
            <Trash2 className="size-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  )
}

function VideoScriptCard({ content, onEdit, onDelete }: ContentCardProps) {
  const videoContent = content.content as VideoScriptContent
  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800">
      <p className="text-zinc-400 mb-4 leading-relaxed">{truncate(videoContent.script, 300)}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              content.status === 'ready'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {content.status === 'ready' ? 'Listo' : 'Editado'}
          </span>
          <span className="text-xs text-zinc-500">{formatDate(content.updatedAt)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Pencil className="size-4 mr-1" />
            Editar
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
          >
            <Trash2 className="size-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function ContentDetail() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { ideaId } = useParams({ strict: false })

  const {
    data: idea,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['idea', ideaId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/api/ideas/${ideaId}`, {
        credentials: 'include',
      })
      if (res.status === 404) throw new Error('Idea not found')
      if (!res.ok) throw new Error('Error fetching idea')
      return res.json() as Promise<Idea>
    },
  })

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const res = await fetch(`http://localhost:3000/api/generate/${contentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Error deleting content')
      return res.json() as Promise<{ success: boolean }>
    },
    onSuccess: (_, contentId) => {
      queryClient.setQueryData<Idea>(['idea', ideaId], (old) => {
        if (!old) return old
        const filtered = old.generatedContents.filter((gc) => gc.id !== contentId)
        return { ...old, generatedContents: filtered }
      })
    },
    onError: (err) => {
      console.error(err)
    },
  })

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="h-10 w-64 bg-zinc-800 rounded animate-pulse mb-2" />
        <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse" />
      </div>
    )
  }

  if (error || !idea) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-16">
        <p className="text-zinc-400 mb-4">No se encontró esta idea</p>
        <Button
          onClick={() => navigate({ to: '/dashboard/content' })}
          className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
        >
          Volver al listado
        </Button>
      </div>
    )
  }

  const availableFormats = ['blog', 'instagram', 'video_script'] as const
  const tabsWithContent = availableFormats.filter((format) =>
    idea.generatedContents.some(
      (gc) => gc.format === format && (gc.status === 'ready' || gc.status === 'edited')
    )
  )
  const getContentsByFormat = (format: string) =>
    idea.generatedContents.filter(
      (gc) => gc.format === format && (gc.status === 'ready' || gc.status === 'edited')
    )

  return (
    <div className="p-8">
      <Button
        onClick={() => navigate({ to: '/dashboard/content' })}
        variant="ghost"
        className="mb-4 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
      >
        <ArrowLeft className="size-4 mr-2" />
        Volver
      </Button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-zinc-50">{idea.title}</h1>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              idea.mode === 'quick'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-purple-500/20 text-purple-400'
            }`}
          >
            {idea.mode === 'quick' ? 'Rápido' : 'Borrador'}
          </span>
        </div>
        <p className="text-sm text-zinc-500">{formatDate(idea.updatedAt)}</p>
      </div>

      <Tabs defaultValue={tabsWithContent[0]} className="w-full">
        <TabsList className="bg-zinc-800 border border-zinc-700 mb-6">
          {tabsWithContent.map((format) => (
            <TabsTrigger
              key={format}
              value={format}
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-50"
            >
              {FORMAT_LABELS[format]}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsWithContent.map((format) => {
          const contents = getContentsByFormat(format)
          if (contents.length === 0) return null

          return (
            <TabsContent key={format} value={format}>
              <div className="space-y-4">
                {contents.map((content) => (
                  <div key={content.id}>
                    {format === 'blog' && (
                      <BlogCard
                        content={content}
                        onEdit={() => navigate({ to: `/dashboard/content/editor/${content.id}` })}
                        onDelete={() => {
                          if (window.confirm('¿Eliminar este contenido?'))
                            deleteContentMutation.mutate(content.id)
                        }}
                      />
                    )}
                    {format === 'instagram' && (
                      <InstagramCard
                        content={content}
                        onEdit={() => navigate({ to: `/dashboard/content/editor/${content.id}` })}
                        onDelete={() => {
                          if (window.confirm('¿Eliminar este contenido?'))
                            deleteContentMutation.mutate(content.id)
                        }}
                      />
                    )}
                    {format === 'video_script' && (
                      <VideoScriptCard
                        content={content}
                        onEdit={() => navigate({ to: `/dashboard/content/editor/${content.id}` })}
                        onDelete={() => {
                          if (window.confirm('¿Eliminar este contenido?'))
                            deleteContentMutation.mutate(content.id)
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
