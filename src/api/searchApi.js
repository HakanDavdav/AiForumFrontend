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
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return []
  }
}
