import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import './index.css'
import { useSession } from './lib/auth-client'

const queryClient = new QueryClient()

function AppWithSession() {
  const { data: session } = useSession()
  return <RouterProvider router={router} context={{ session }} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppWithSession />
    </QueryClientProvider>
  </React.StrictMode>
)