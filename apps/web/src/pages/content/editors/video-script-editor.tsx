import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface VideoScriptContent {
  script: string
}

interface VideoScriptEditorProps {
  content: VideoScriptContent
  contentId: string
  ideaId: string
  ideaTitle: string
}

interface Section {
  label: string
  tag: string
}

function parseSections(script: string): Section[] {
  const sections: Section[] = []
  const ganchoMatch = script.match(/\[GANCHO\]/)
  if (ganchoMatch) {
    sections.push({ label: 'Gancho', tag: '[GANCHO]' })
  }
  const sectionMatches = script.matchAll(/\[SECCIÓN:\s*([^\]]+)\]/g)
  for (const match of sectionMatches) {
    sections.push({ label: match[1].trim(), tag: match[0] })
  }
  const cierreMatch = script.match(/\[CIERRE\]/)
  if (cierreMatch) {
    sections.push({ label: 'Cierre', tag: '[CIERRE]' })
  }
  return sections
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function VideoScriptEditor({
  content,
  contentId,
  ideaId,
  ideaTitle,
}: VideoScriptEditorProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [script, setScript] = useState(content.script)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:3000/api/generate/${contentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { script } }),
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
  }, [script])

  const sections = parseSections(script)
  const wordCount = countWords(script)
  const minutes = Math.round(wordCount / 150)

  const scrollToSection = useCallback(
    (tag: string) => {
      if (!textareaRef.current) return
      const index = script.indexOf(tag)
      if (index === -1) return
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(index, index)
      const scrollTop = textareaRef.current.scrollTop
      const lineHeight = 25.2
      const linesBefore = script.substring(0, index).split('\n').length
      textareaRef.current.scrollTop = Math.max(0, (linesBefore - 3) * lineHeight)
    },
    [script]
  )

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
            Video Script
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-[120px] justify-end">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="size-3 border-2 border-zinc-500/30 border-t-zinc-500 rounded-full animate-spin" />
              Guardando...
            </span>
          )}
          {saveStatus === 'saved' && <span className="text-xs text-green-400">Guardado ✓</span>}
          {saveStatus === 'error' && <span className="text-xs text-red-400">Error al guardar</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {sections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sections.map((section, i) => (
                <button
                  key={i}
                  onClick={() => scrollToSection(section.tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                >
                  {section.label}
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full min-h-[600px] rounded-md border border-zinc-700 bg-zinc-900/50 text-zinc-50 placeholder:text-zinc-500 px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-zinc-600 leading-[1.8]"
            style={{ fontFamily: 'ui-monospace, monospace' }}
          />

          <div className="flex justify-end">
            <span className="text-xs text-zinc-500">
              {wordCount} palabras · ~{minutes} min de lectura
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
