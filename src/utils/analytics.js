/**
 * Google Analytics 4 (GA4) Integration Utility
 *
 * Provides safe initialization, SPA route tracking, and custom domain event tracking.
 * If the Measurement ID is empty or a dummy placeholder (e.g. 'G-XXXXXXXXXX'),
 * events are logged in development mode without throwing errors or breaking the UI.
 */

const GA_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID ||
  import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
  'G-VZ5X8HWH62'

/**
 * Initializes GA4 script and dataLayer.
 * Injects the official Google gtag.js script and sets up config.
 */
export function initGA() {
  if (typeof window === 'undefined') return
  if (!GA_ID) return

  // Prevent duplicate script insertion
  if (document.getElementById('ga-gtag-script')) return

  try {
    // 1. Create dataLayer and gtag shim before loading the external script
    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    // Disable default page_view because SPA route transitions are tracked explicitly in App.jsx
    window.gtag('config', GA_ID, { send_page_view: false })

    // 2. Dynamically load Google's gtag.js
    const script = document.createElement('script')
    script.id = 'ga-gtag-script'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(script)

    if (import.meta.env.DEV) {
      console.info(`[Analytics] GA4 active with ID: "${GA_ID}". Real network requests are enabled.`)
    }
  } catch (err) {
    console.warn('[Analytics] Failed to initialize Google Analytics:', err)
  }
}

/**
 * Tracks SPA route changes as page_view events.
 * @param {string} pagePath - URL pathname + search query
 * @param {string} [pageTitle] - Optional page title
 */
export function trackPageView(pagePath, pageTitle = document.title) {
  if (typeof window === 'undefined') return

  if (import.meta.env.DEV) {
    console.log('[Analytics PageView]', { pagePath, pageTitle })
  }

  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
      })
    } catch (err) {
      console.warn('[Analytics] trackPageView error:', err)
    }
  }
}

/**
 * Tracks a custom event safely.
 * @param {string} eventName - GA4 event name
 * @param {Record<string, any>} [params] - Event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return

  if (import.meta.env.DEV) {
    console.log(`[Analytics Event: ${eventName}]`, params)
  }

  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, params)
    } catch (err) {
      console.warn(`[Analytics] trackEvent (${eventName}) error:`, err)
    }
  }
}

/**
 * Tracks user login with authentication method.
 * @param {'password' | 'two_factor' | 'google' | 'microsoft' | string} method
 */
export function trackLogin(method = 'password') {
  trackEvent('login', { method })
}

/**
 * Tracks user sign-up with registration method.
 * @param {'email' | 'google' | 'microsoft' | string} method
 */
export function trackSignUp(method = 'email') {
  trackEvent('sign_up', { method })
}

/**
 * Tracks bot creation.
 * @param {{ bot_id?: string, name?: string, [key: string]: any }} params
 */
export function trackCreateBot(params = {}) {
  trackEvent('create_bot', params)
}

/**
 * Tracks post creation.
 * @param {{ post_id?: string, title?: string, tribe_id?: string|null, [key: string]: any }} params
 */
export function trackCreatePost(params = {}) {
  trackEvent('create_post', params)
}

/**
 * Tracks entry/reply creation.
 * @param {{ parent_content_id?: string, [key: string]: any }} params
 */
export function trackCreateEntry(params = {}) {
  trackEvent('create_entry', params)
}

/**
 * Tracks debate actions (join, speech, trigger, accept).
 * @param {'join' | 'speech' | 'trigger' | 'accept_challenge' | string} action
 * @param {Record<string, any>} [params]
 */
export function trackDebate(action, params = {}) {
  trackEvent('debate_action', { action, ...params })
}

/**
 * Tracks beginning checkout (Stripe checkout session initiation).
 * @param {{ plan?: string, [key: string]: any }} params
 */
export function trackBeginCheckout(params = {}) {
  trackEvent('begin_checkout', params)
}
