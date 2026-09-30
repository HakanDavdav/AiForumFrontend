import axios from 'axios'

/**
 * Merkezi Axios instance.
 * - baseURL: Vite proxy üzerinden /api backend'e yönleniyor
 * - withCredentials: ASP.NET Core Identity cookie auth için zorunlu
 * - Response interceptor: WebIdentityResult envelope'u unwrap eder
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Dev-only Request Logger ──────────────────────────────────────────────────
if (import.meta.env.DEV) {
  api.interceptors.request.use((config) => {
    console.log(`[API ➤] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, { params: config.params, data: config.data })
    return config
  })
}

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Backend her zaman WebIdentityResult<T> döner:
// { succeeded: bool, data: T | null, errors: AppError[] }
api.interceptors.response.use(
  (response) => {
    const result = response.data

    // succeeded: false → hata olarak fırlat
    if (result && typeof result === 'object' && result.succeeded === false) {
      const errorMessages = result.errors?.map((e) => e.description || e.message || e).join(', ') || 'Bir hata oluştu'
      const error = new Error(errorMessages)
      error.errors = result.errors || []
      error.isApiError = true
      if (import.meta.env.DEV) {
        console.log(`[API ✗] ${response.config?.method?.toUpperCase()} ${response.config?.url}`, { errors: result.errors })
      }
      return Promise.reject(error)
    }

    const traceId = response.headers?.['x-trace-id']
    if (traceId && typeof window !== 'undefined') {
      window.__lastApiSuccessTraceId = traceId
      window.__lastApiSuccessTraceTime = Date.now()
    }

    if (import.meta.env.DEV) {
      console.log(`[API ✓] ${response.config?.method?.toUpperCase()} ${response.config?.url}`, { data: result?.data ?? result })
    }

    return response
  },
  (error) => {
    const data = error.response?.data
    const traceId = error.response?.headers?.['x-trace-id']
    if (traceId) {
      error.traceId = traceId
      if (typeof window !== 'undefined') {
        window.__lastApiTraceId = traceId
        window.__lastApiTraceTime = Date.now()
      }
    }

    if (data && typeof data === 'object') {
      const rawErrors = data.errors || data.Errors
      if (Array.isArray(rawErrors) && rawErrors.length > 0) {
        error.errors = rawErrors
        const messages = rawErrors
          .map((e) => (typeof e === 'string' ? e : e?.description || e?.Description || e?.message || e?.Message))
          .filter(Boolean)
        if (messages.length > 0) {
          error.message = messages.join(', ')
        }
      } else if (typeof data.message === 'string') {
        error.message = data.message
      }
    }

    // HTTP seviyesinde hata (401, 403, 500 vb.)
    if (import.meta.env.DEV) {
      console.log(`[API ✗] ${error.config?.method?.toUpperCase()} ${error.config?.url} — HTTP ${error.response?.status} [Trace: ${traceId || 'N/A'}]`, { error: data })
    }
    if (error.response?.status === 401) {
      // Cookie geçersiz — auth store'u temizle
      // (circular dependency önlemek için event yayıyoruz)
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
