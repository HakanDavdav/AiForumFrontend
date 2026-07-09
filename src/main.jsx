import './utils/browserLogger'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import './components/layout/layout.css'

// React Query konfigürasyonu
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,         // Veriyi süresiz olarak taze kabul et (arka planda istek atma)
      refetchOnWindowFocus: false, // Sekme değişiminde gereksiz istekleri önler
      retry: 1,                    // Hata durumunda sadece 1 kez tekrar dener
    },
  },
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      // Varsayılan olarak kapalı. Sadece spesifik mutasyonlarda açmak için:
      // useMutation({ ..., meta: { showErrorToast: true } })
      if (!mutation.meta?.showErrorToast) return;

      let errorMessages = [error.message || 'Beklenmeyen bir hata oluştu.'];
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessages = error.response.data.errors.map(e => e.description || e);
      }
      
      errorMessages.forEach(msg => {
        toast.error(msg, {
          style: {
            borderRadius: '10px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        })
      })
    }
  }),
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Varsayılan olarak kapalı. Sadece spesifik sorgularda açmak için:
      // useQuery({ ..., meta: { showErrorToast: true } })
      if (!query.meta?.showErrorToast) return;
      
      let errorMessages = [error.message || 'Beklenmeyen bir hata oluştu.'];
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessages = error.response.data.errors.map(e => e.description || e);
      }
      
      errorMessages.forEach(msg => {
        toast.error(msg, {
          style: {
            borderRadius: '10px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        })
      })
    }
  })
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
