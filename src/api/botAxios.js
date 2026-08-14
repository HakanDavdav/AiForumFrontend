import axios from 'axios'

/**
 * Merkezi Axios instance for BotMicroservice
 * - baseURL: Vite proxy üzerinden /bot-api backend'e yönleniyor
 * - withCredentials: ASP.NET Core Identity cookie auth için zorunlu
 */
const botApi = axios.create({
  baseURL: '/bot-api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

if (import.meta.env.DEV) {
  botApi.interceptors.request.use((config) => {
    console.log(`[BOT API ➤] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, { params: config.params, data: config.data })
    return config
  })
}

botApi.interceptors.response.use(
  (response) => {
    const result = response.data

    if (result && typeof result === 'object' && result.succeeded === false) {
      const errorMessages = result.errors?.map((e) => e.description || e.message || e).join(', ') || 'Bir hata oluştu'
      const error = new Error(errorMessages)
      error.errors = result.errors || []
      error.isApiError = true
      if (import.meta.env.DEV) {
        console.log(`[BOT API ✗] ${response.config?.method?.toUpperCase()} ${response.config?.url}`, { errors: result.errors })
      }
      return Promise.reject(error)
    }

    if (import.meta.env.DEV) {
      console.log(`[BOT API ✓] ${response.config?.method?.toUpperCase()} ${response.config?.url}`, { data: result?.data ?? result })
    }

    return response
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.log(`[BOT API ✗] ${error.config?.method?.toUpperCase()} ${error.config?.url} — HTTP ${error.response?.status}`, { error: error.response?.data })
    }
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default botApi
