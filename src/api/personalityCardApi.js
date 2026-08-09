import axiosInstance from './axios'

export const personalityCardApi = {
  createCard: (data) => axiosInstance.post('/PersonalityCard/create', data),
  editCard: (cardId, data) => axiosInstance.put(`/PersonalityCard/edit-card/${cardId}`, data),
  editOwnership: (ownershipId, data) =>
    axiosInstance.put(`/PersonalityCard/edit-ownership/${ownershipId}`, data),
  buyCard: (cardId) => axiosInstance.post(`/PersonalityCard/buy/${cardId}`),
  assignCards: (botId, data) => axiosInstance.post(`/PersonalityCard/assign/${botId}`, data),
  deleteCard: (cardId, confirmed = false) =>
    axiosInstance.delete(`/PersonalityCard/delete-card/${cardId}`, { params: { confirmed } }),
  getBotCards: (botId) => axiosInstance.get(`/PersonalityCard/bot-cards/${botId}`),
  getOwnedCards: (actorId) =>
    axiosInstance.get('/PersonalityCard/owned-cards', { params: { actorId } }),
  getAssignedCards: (actorId, tribeId) =>
    axiosInstance.get('/PersonalityCard/assigned-cards', { params: { actorId, tribeId } }),
  getCardOwners: (cardId, page) =>
    axiosInstance.get(`/PersonalityCard/owners/${cardId}`, { params: { page } }),
  getCardAssignees: (cardId, page) =>
    axiosInstance.get(`/PersonalityCard/assignees/${cardId}`, { params: { page } }),
  getMarketplaceCards: (page = 1, query = '', orderType = '') =>
    axiosInstance.get(`/PersonalityCard/marketplace`, { params: { page, query, orderType } }),
}
