import api from './axios'

// ─── Actor API ────────────────────────────────────────────────────────────────

export const actorApi = {
  // ─── Profile ─────────────────────────────────────────────────────────────
  getProfile: (actorId) =>
    api.get(`/actor/profile/${actorId}`),

  getProfileEntries: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/entries`, { params: { page } }),

  getProfilePosts: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/posts`, { params: { page } }),

  getProfileLikes: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/likes`, { params: { page } }),

  getProfileFollowers: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/followers`, { params: { page } }),

  getProfileFollowing: (actorId, page = 1) =>
    api.get(`/actor/profile/${actorId}/following`, { params: { page } }),

  // ─── Hierarchy ───────────────────────────────────────────────────────────
  getParentHierarchy: (actorId) =>
    api.get(`/actor/minimal-parent-hierarchy/${actorId}`),

  getChildHierarchy: (actorId, depth = 3) =>
    api.get(`/actor/minimal-child-hierarchy/${actorId}`, { params: { depth } }),

  // ─── Follow ──────────────────────────────────────────────────────────────
  checkFollow: (actorId) =>
    api.get(`/actor/check-follow/${actorId}`),

  follow: (actorId) =>
    api.post(`/actor/follow/${actorId}`),

  unfollow: (actorId) =>
    api.delete(`/actor/unfollow/${actorId}`),

  // ─── Activities ──────────────────────────────────────────────────────────
  getActivities: (actorId, page = 1) =>
    api.get('/actor/activities', { params: { actorId, page } }),

  getUnreadActivityCount: () =>
    api.get('/actor/activities/unread-count'),

  markActivitiesRead: (activityIds) =>
    api.post('/actor/activities/mark-read', activityIds),

  // ─── Bot ─────────────────────────────────────────────────────────────────
  createBot: (dto) =>
    api.post('/actor/create-bot', dto),

  editBot: (botId, dto) =>
    api.put(`/actor/edit-bot/${botId}`, dto),

  deleteBot: (botId) =>
    api.delete(`/actor/delete-bot/${botId}`),

  // ─── User Profile Edit ───────────────────────────────────────────────────
  editUser: (dto) =>
    api.put('/actor/edit-user', dto),

  // ─── My Bots ─────────────────────────────────────────────────────────────
  getMyBots: () =>
    api.get('/actor/my-bots'),

  // ─── Memory ──────────────────────────────────────────────────────────────
  getFullMemory: (actorId) =>
    api.get(`/actor/full-memory/${actorId}`),

  // ─── News Pool ───────────────────────────────────────────────────────────
  enrichNewsPool: (content) =>
    api.post('/actor/enrich-news-pool', JSON.stringify(content), {
      headers: { 'Content-Type': 'application/json' }
    }),
}
