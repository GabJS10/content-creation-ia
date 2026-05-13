import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { BlogEditor } from './editors/blog-editor'
import { InstagramEditor } from './editors/instagram-editor'
import { VideoScriptEditor } from './editors/video-script-editor'

interface ContentResponse {
  id: string
  ideaId: string
  format: 'blog' | 'instagram' | 'video_script'
  status: string
  content: {
    title: string
    body: string
  }
  updatedAt: string
  idea: {
    id: string
    title: string
    mode: string
  }
}

export function ContentEditor() {
  const navigate = useNavigate()
  const { contentId } = useParams({ strict: false })

  const { data: contentData, isLoading, error } = useQuery({
    queryKey: ['content', contentId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3000/api/generate/${contentId}`, {
        credentials: 'include',
      })
      if (res.status === 404) throw new Error('Content not found')
      if (!res.ok) throw new Error('Error fetching content')
      return res.json() as Promise<ContentResponse>
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
          <div className="h-8 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-10 w-full bg-zinc-800 rounded animate-pulse" />
          <div className="h-96 w-full bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !contentData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-zinc-400 mb-4">Contenido no encontrado</p>
        <Button
          onClick={() => navigate({ to: '/dashboard/content' })}
          className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
        >
          Volver al listado
        </Button>
      </div>
    )
  }

  if (contentData.format === 'blog') {
    return (
      <BlogEditor
        content={contentData.content}
        contentId={contentData.id}
        ideaId={contentData.ideaId}
        ideaTitle={contentData.idea.title}
      />
    )
  }

  if (contentData.format === 'instagram') {
    return (
      <InstagramEditor
        content={contentData.content as unknown as { caption: string; cards: Array<{ text: string }> }}
        contentId={contentData.id}
        ideaId={contentData.ideaId}
        ideaTitle={contentData.idea.title}
      />
    )
  }

  if (contentData.format === 'video_script') {
    return (
      <VideoScriptEditor
        content={contentData.content as unknown as { script: string }}
        contentId={contentData.id}
        ideaId={contentData.ideaId}
        ideaTitle={contentData.idea.title}
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-zinc-400">Formato no soportado</p>
    </div>
  )
}