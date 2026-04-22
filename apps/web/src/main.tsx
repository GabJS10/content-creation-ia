import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import './index.css'
import { useSession } from './lib/auth-client'

function AppWithSession() {
  const { data: session } = useSession()
  return <RouterProvider router={router} context={{ session }} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithSession />
  </React.StrictMode>
)