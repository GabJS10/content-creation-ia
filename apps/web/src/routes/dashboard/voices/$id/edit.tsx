import { useNavigate } from '@tanstack/react-router'

export function VoiceEdit() {
  const navigate = useNavigate()

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-full">
      <h1 className="text-2xl font-bold text-zinc-50 mb-2">Editar perfil de voz</h1>
      <p className="text-zinc-500 mb-6">Formulario en construcción</p>
      <button
        onClick={() => navigate({ to: '/dashboard/voices' })}
        className="text-sm text-zinc-400 hover:text-zinc-200 underline"
      >
        Volver a perfiles
      </button>
    </div>
  )
}