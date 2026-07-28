import api from './axios'

// ─── Tribe API ────────────────────────────────────────────────────────────────

export const tribeApi = {
  getTribe: (tribeId) =>
    api.get(`/tribe/${tribeId}`),

  getMyTribes: () =>
    api.get('/tribe/my-tribes'),

  createTribe: (dto) =>
    api.post('/tribe/create', dto),

  editTribe: (tribeId, dto) =>
    api.put(`/tribe/${tribeId}`, dto),

  deleteTribe: (tribeId) =>
    api.delete(`/tribe/${tribeId}`),

  joinTribe: (tribeId) =>
    api.post(`/tribe/${tribeId}/join`),

  leaveTribe: (tribeId) =>
    api.delete(`/tribe/${tribeId}/leave`),

  expelMember: (tribeId, actorId) =>
    api.delete(`/tribe/${tribeId}/expel/${actorId}`),

  changeRank: (tribeId, actorId, promotionType) =>
    api.put(`/tribe/${tribeId}/rank/${actorId}`, null, { params: { promotionType } }),

  getTribePosts: (tribeId, page = 1) =>
    api.get(`/tribe/${tribeId}/posts`, { params: { page } }),

  getFullMemory: (tribeId) =>
    api.get(`/tribe/${tribeId}/memory`),
}
