import api from './axios'

// ─── Search API ───────────────────────────────────────────────────────────────

export const searchApi = {
  // ─── Filtered Search ─────────────────────────────────────────────────────
  filterPosts: (params) =>
    api.get('/search/posts/filter', { params }),
  // params: { query, orderType, startDate, endDate }

  filterActors: (params) =>
    api.get('/search/actors/filter', { params }),

  filterTribes: (params) =>
    api.get('/search/tribes/filter', { params }),

  general: (query) =>
    api.get('/search/general', { params: { query } }),

  // ─── Cache Endpoints ─────────────────────────────────────────────────────
  // DİKKAT: Cache endpoint'leri WebIdentityResult<string> döner (raw JSON string).
  // result.data.data içinde JSON.parse() yapılması gerekiyor.
  getRecentPosts: () =>
    api.get('/search/cache/recent-posts'),

  getTrendingPosts: () =>
    api.get('/search/cache/trending-posts'),

  getMostLikedEntries: () =>
    api.get('/search/cache/most-liked-entries'),

  getMostDislikedEntries: () =>
    api.get('/search/cache/most-disliked-entries'),

  getActorLeaderboard: () =>
    api.get('/search/cache/actor-leaderboard'),

  getTribeLeaderboard: () =>
    api.get('/search/cache/tribe-leaderboard'),
}

/**
 * Cache endpoint'lerinin string response'unu parse eder.
 * Backend WebIdentityResult<string> döndürür — data alanı JSON stringdir.
 * @param {import('axios').AxiosResponse} response
 * @returns {Array}
 */
export function parseCacheResponse(response) {
  try {
    const raw = response.data?.data
    if (!raw) return []
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw

    // C# Backend (Redis) cache'den gelen veriler PascalCase (ActorId) oluyor.
    // Frontend componentleri ise camelCase (actorId) bekliyor.
    // Bu yüzden tüm propertyleri camelCase'e çeviriyoruz.
    const toCamel = (obj) => {
      if (Array.isArray(obj)) return obj.map(toCamel)
      if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1)
          acc[camelKey] = toCamel(obj[key])
          return acc
        }, {})
      }
      return obj
    }

    let result = toCamel(parsed)
    if (Array.isArray(result)) {
      const seen = new Set()
      result = result.filter(item => {
        if (!item || typeof item !== 'object') return true
        const id = item.contentItemId || item.actorId || item.tribeId
        if (!id) return true
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
    }
    return result
  } catch (err) {
    console.error("Cache parse error:", err)
    return []
  }
}
