import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#193133',
            color: '#FEFCF7',
            border: '1px solid rgba(67,136,142,0.4)',
            fontFamily: 'Manrope, system-ui, sans-serif',
          },
          success: { iconTheme: { primary: '#27EAAF', secondary: '#193133' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#193133' } },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
