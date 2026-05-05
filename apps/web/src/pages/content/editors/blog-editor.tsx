import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ArrowLeft, Save } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BlogContent {
  title: string
  body: string
}

interface BlogEditorProps {
  content: BlogContent
  contentId: string
  ideaId: string
  ideaTitle: string
}

export function BlogEditor({ content, contentId, ideaId, ideaTitle }: BlogEditorProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(content.title)
  const [htmlContent, setHtmlContent] = useState('')
  const [isHtmlReady, setIsHtmlReady] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [initialState, setInitialState] = useState<{ title: string; body: string } | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {},
        orderedList: {},
      }),
    ],
    content: htmlContent,
  })

  useEffect(() => {
    setHtmlContent(content.body)
    setInitialState({ title: content.title, body: content.body })
    setIsHtmlReady(true)
  }, [content.body, content.title])

  useEffect(() => {
    if (editor && isHtmlReady && htmlContent) {
      editor.commands.setContent(htmlContent)
    }
  }, [editor, isHtmlReady, htmlContent])

  const hasChanges = initialState
    ? title !== initialState.title || (editor ? editor.getHTML() !== initialState.body : false)
    : false

  console.log(editor?.getHTML())

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editor) return
      const bodyHtml = editor.getHTML()
      const res = await fetch(`http://localhost:3000/api/generate/${contentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { title, body: bodyHtml } }),
      })
      if (!res.ok) throw new Error('Error saving')
      return res.json()
    },
    onSuccess: () => {
      if (editor) {
        setInitialState({ title, body: editor.getHTML() })
      } else {
        setInitialState({ title, body: '' })
      }
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
      queryClient.invalidateQueries({ queryKey: ['idea', ideaId] })
      queryClient.invalidateQueries({ queryKey: ['content', contentId] })
    },
  })

  const toggleFormat = useCallback(
    (format: string) => {
      if (!editor) return
      switch (format) {
        case 'bold':
          editor.chain().focus().toggleBold().run()
          break
        case 'italic':
          editor.chain().focus().toggleItalic().run()
          break
        case 'h1':
          editor.chain().focus().toggleHeading({ level: 1 }).run()
          break
        case 'h2':
          editor.chain().focus().toggleHeading({ level: 2 }).run()
          break
        case 'h3':
          editor.chain().focus().toggleHeading({ level: 3 }).run()
          break
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run()
          break
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run()
          break
      }
    },
    [editor]
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
            Blog
          </span>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
          className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <span className="size-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin mr-2" />
          ) : showSaved ? (
            <span className="text-green-600 mr-2">✓</span>
          ) : (
            <Save className="size-4 mr-2" />
          )}
          {showSaved ? 'Guardado' : 'Guardar'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              Título del artículo
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border-zinc-700 text-zinc-50 text-lg font-semibold"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-2 border border-zinc-800 rounded-lg p-1 bg-zinc-900/50">
              <button
                onClick={() => toggleFormat('bold')}
                className={`p-2 rounded text-sm font-bold transition-colors ${
                  editor?.isActive('bold')
                    ? 'bg-zinc-700 text-zinc-50'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                B
              </button>
              <button
                onClick={() => toggleFormat('italic')}
                className={`p-2 rounded text-sm italic transition-colors ${
                  editor?.isActive('italic')
                    ? 'bg-zinc-700 text-zinc-50'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                I
              </button>
              <button
                onClick={() => toggleFormat('h1')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  editor?.isActive('heading', { level: 1 })
                    ? 'bg-zinc-700 text-zinc-50'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                H1
              </button>
              <button
                onClick={() => toggleFormat('h2')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  editor?.isActive('heading', { level: 2 })
                    ? 'bg-zinc-700 text-zinc-50'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                H2
              </button>
              <button
                onClick={() => toggleFormat('h3')}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  editor?.isActive('heading', { level: 3 })
                    ? 'bg-zinc-700 text-zinc-50'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                H3
              </button>
              <button
                onClick={() => toggleFormat('bulletList')}
                className={`p-2 rounded transition-colors ${
                  editor?.isActive('bulletList')
                    ? 'bg-zinc-700 text-zinc-50'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => toggleFormat('orderedList')}
                className={`p-2 rounded transition-colors ${
                  editor?.isActive('orderedList')
                    ? 'bg-zinc-700 text-zinc-50'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7v8a2 2 0 002 2h4M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 002 2h2a2 2 0 002-2M5 12h12M5 18h12"
                  />
                </svg>
              </button>
            </div>

            <div className="border border-zinc-700 rounded-lg overflow-hidden">
              <EditorContent
                editor={editor}
                className="prose prose-invert prose-zinc max-w-none p-4 min-h-[500px] bg-zinc-900/50 text-zinc-50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
