import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface InstagramContent {
  caption: string
  cards: Array<{ text: string }>
}

interface InstagramEditorProps {
  content: InstagramContent
  contentId: string
  ideaId: string
  ideaTitle: string
}

function getCaptionColor(chars: number) {
  if (chars >= 100 && chars <= 300) return 'text-green-400'
  if (chars > 300 && chars <= 500) return 'text-yellow-400'
  if (chars > 500) return 'text-red-400'
  return 'text-zinc-500'
}

function getSlideColor(chars: number) {
  if (chars >= 500 && chars <= 1000) return 'text-green-400'
  if (chars >= 300 && chars < 500) return 'text-yellow-400'
  return 'text-red-400'
}

export function InstagramEditor({ content, contentId, ideaId, ideaTitle }: InstagramEditorProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [caption, setCaption] = useState(content.caption)
  const [cards, setCards] = useState<Array<{ text: string }>>(content.cards)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:3000/api/generate/${contentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { caption, cards } }),
      })
      if (!res.ok) throw new Error('Error saving')
      return res.json()
    },
    onSuccess: () => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] })
      queryClient.invalidateQueries({ queryKey: ['content', contentId] })
    },
    onError: () => {
      setSaveStatus('error')
    },
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setSaveStatus('saving')
      saveMutation.mutate()
    }, 1500)
    return () => clearTimeout(timer)
  }, [caption, cards])

  const updateCard = (index: number, text: string) => {
    setCards((prev) => {
      const newCards = [...prev]
      newCards[index] = { text }
      return newCards
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate({ to: `/dashboard/content/${ideaId}` })}
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <ArrowLeft className="size-4 mr-2" />
            Volver
          </Button>
          <span className="text-sm text-zinc-500">Editando: {ideaTitle}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400">
            Instagram
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="size-3 border-2 border-zinc-500/30 border-t-zinc-500 rounded-full animate-spin" />
              Guardando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-400">Guardado ✓</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs text-red-400">Error al guardar</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              Caption de la publicación
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900/50 text-zinc-50 placeholder:text-zinc-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${getCaptionColor(caption.length)}`}>
                {caption.length} caracteres
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card, index) => (
              <div
                key={index}
                className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-300">Slide {index + 1}</span>
                  <span className={`text-xs ${getSlideColor(card.text.length)}`}>
                    {card.text.length} / 1000
                  </span>
                </div>
                <textarea
                  value={card.text}
                  onChange={(e) => updateCard(index, e.target.value)}
                  rows={9}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 text-zinc-50 placeholder:text-zinc-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}