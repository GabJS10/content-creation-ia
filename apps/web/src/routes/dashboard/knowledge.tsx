import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KnowledgeSource {
  id: string
  title: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  chunksCount: number | null
  errorMessage: string | null
  createdAt: string
}

type SSEStage =
  | 'received'
  | 'reading'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'saving'
  | 'ready'
  | 'error'

const STAGE_PROGRESS: Record<SSEStage, number> = {
  received: 10,
  reading: 20,
  extracting: 35,
  chunking: 50,
  embedding: 75,
  saving: 90,
  ready: 100,
  error: 0,
}

interface ActiveProgress {
  sourceId: string
  percentage: number
  message: string
  stage: SSEStage
}

export function KnowledgeSources() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [activeProgress, setActiveProgress] = useState<ActiveProgress | null>(null)

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['knowledge-sources'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/knowledge', {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Error fetching sources')
      return res.json() as Promise<KnowledgeSource[]>
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ file, title }: { file: File; title: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      const res = await fetch('http://localhost:3000/api/knowledge/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Upload failed')
      }
      return res.json() as Promise<{ source_id: string }>
    },
    onSuccess: (data, { title, file }) => {
      setUploadError(null)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      queryClient.setQueryData<KnowledgeSource[]>(['knowledge-sources'], (old) => {
        const newSource: KnowledgeSource = {
          id: data.source_id,
          title,
          status: 'pending',
          chunksCount: null,
          errorMessage: null,
          createdAt: new Date().toISOString(),
        }
        return old ? [newSource, ...old] : [newSource]
      })

      setActiveProgress({
        sourceId: data.source_id,
        percentage: 10,
        message: 'Documento recibido',
        stage: 'received',
      })

      const es = new EventSource(`http://localhost:3000/api/knowledge/${data.source_id}/stream`)

      es.onmessage = (e) => {
        const event = JSON.parse(e.data) as {
          stage: SSEStage
          message: string
          chunks_count?: number
        }

        if (event.stage !== 'ready' && event.stage !== 'error') {
          setActiveProgress({
            sourceId: data.source_id,
            percentage: STAGE_PROGRESS[event.stage],
            message: event.message,
            stage: event.stage,
          })
        } else {
          queryClient.setQueryData<KnowledgeSource[]>(['knowledge-sources'], (old) => {
            if (!old) return old
            return old.map((s) =>
              s.id === data.source_id
                ? {
                    ...s,
                    status: event.stage === 'ready' ? 'ready' : 'error',
                    chunksCount: event.chunks_count ?? s.chunksCount,
                    errorMessage: event.stage === 'error' ? event.message : null,
                  }
                : s
            )
          })

          setActiveProgress({
            sourceId: data.source_id,
            percentage: STAGE_PROGRESS[event.stage],
            message: event.message,
            stage: event.stage,
          })

          if (event.stage === 'ready' || event.stage === 'error') {
            setTimeout(() => setActiveProgress(null), 3000)
          }

          es.close()
        }
      }

      es.onerror = () => {
        es.close()
        setUploadError('Conexión perdida con el servidor')
        setActiveProgress(null)
      }
    },
    onError: (err: Error) => {
      setUploadError(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`http://localhost:3000/api/knowledge/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Delete failed')
      return res.json()
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<KnowledgeSource[]>(['knowledge-sources'], (old) => {
        if (!old) return old
        return old.filter((s) => s.id !== id)
      })
    },
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getTitleFromFilename = (filename: string) => {
    return filename.replace(/\.pdf$/i, '').slice(0, 40)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = () => {
    if (!file) return
    const title = getTitleFromFilename(file.name)
    uploadMutation.mutate({ file, title })
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Gestionar documentos</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Sube y organiza los documentos que usará el modelo para sus respuestas.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative mb-6 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
          isDragging
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileSelect}
        />

        {!file ? (
          <>
            <Upload className="size-10 text-zinc-500" />
            <div className="text-center">
              <p className="text-zinc-300 font-medium">Arrastra tu PDF aquí</p>
              <p className="text-sm text-zinc-500 mt-1">o haz clic para explorar · Max. 50MB</p>
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="size-6 text-indigo-400" />
              <div>
                <p className="text-zinc-200 font-medium">{getTitleFromFilename(file.name)}</p>
                <p className="text-sm text-zinc-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="size-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpload()
                }}
                disabled={uploadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-50 text-zinc-900 text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {uploadMutation.isPending ? (
                  <>
                    <span className="size-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  'Subir documento'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {uploadError && <p className="mb-4 text-sm text-red-400">{uploadError}</p>}

      {activeProgress && (
        <div
          className={cn(
            'mb-6 rounded-lg border p-4',
            activeProgress.stage === 'ready'
              ? 'border-green-500/50 bg-green-500/5'
              : activeProgress.stage === 'error'
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-indigo-500/50 bg-indigo-500/5'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-200 truncate mr-4">
              {sources.find((s) => s.id === activeProgress.sourceId)?.title || 'Documento'}
            </span>
            <span className="text-sm text-zinc-500 shrink-0">{activeProgress.message}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                activeProgress.stage === 'ready'
                  ? 'bg-green-500'
                  : activeProgress.stage === 'error'
                    ? 'bg-red-500'
                    : 'bg-indigo-500 animate-pulse'
              )}
              style={{ width: `${activeProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left">
              <th className="px-4 py-3 text-sm font-medium text-zinc-400">Nombre del documento</th>
              <th className="px-4 py-3 text-sm font-medium text-zinc-400">Fecha de subida</th>
              <th className="px-4 py-3 text-sm font-medium text-zinc-400">Fragmentos</th>
              <th className="px-4 py-3 text-sm font-medium text-zinc-400">Estado</th>
              <th className="px-4 py-3 text-sm font-medium text-zinc-400 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="h-5 w-48 bg-zinc-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-28 bg-zinc-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-16 bg-zinc-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-24 bg-zinc-800 rounded animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-8 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))}
              </>
            ) : sources.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  No hay documentos todavía. Sube tu primer PDF para empezar.
                </td>
              </tr>
            ) : (
              sources.map((source) => (
                <tr
                  key={source.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="size-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-200 font-medium truncate">{source.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {formatDate(source.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {source.status === 'ready' && source.chunksCount !== null
                      ? source.chunksCount
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {source.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-700 text-zinc-400">
                        Pendiente
                      </span>
                    )}
                    {source.status === 'processing' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        <span className="size-3 border border-yellow-400/50 border-t-yellow-400 rounded-full animate-spin" />
                        Procesando
                      </span>
                    )}
                    {source.status === 'ready' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                        Listo
                      </span>
                    )}
                    {source.status === 'error' && (
                      <span
                        title={source.errorMessage || 'Error en el procesamiento'}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 cursor-help"
                      >
                        Error
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (source.status === 'processing') return
                        if (window.confirm('¿Eliminar este documento?')) {
                          deleteMutation.mutate(source.id)
                        }
                      }}
                      disabled={source.status === 'processing'}
                      className={cn(
                        'p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors',
                        source.status === 'processing' && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
