import { useSession } from './lib/auth-client'

export default function App() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Cargando...</div>
  if (!session) return <div>Sin sesión</div>

  return <div>Usuario: {session.user.name}</div>
}