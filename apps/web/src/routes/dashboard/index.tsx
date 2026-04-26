import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export function DashboardIndex() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/dashboard/knowledge' })
  }, [navigate])

  return null
}