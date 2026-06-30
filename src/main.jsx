import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'
import './components/layout/layout.css'

// React Query konfigürasyonu
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Sekme değişiminde gereksiz istekleri önler
      retry: 1,                    // Hata durumunda sadece 1 kez tekrar dener
    },
  },
})

// Authentication interceptor error handle (Token düştüğünde vb.)
window.addEventListener('auth:unauthorized', () => {
  import('./store/authStore').then(({ default: useAuthStore }) => {
    useAuthStore.getState().logout()
    // UI Store'dan login'e yönlendirilebilir
    import('./store/uiStore').then(({ default: useUIStore }) => {
      useUIStore.getState().setCenterView('login')
    })
  })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
