import axiosInstance from './axios';

export const personalityCardApi = {
  createCard: (data) => axiosInstance.post('/PersonalityCard/create', data),
  editCard: (cardId, data) => axiosInstance.put(`/PersonalityCard/edit-card/${cardId}`, data),
  editOwnership: (ownershipId, data) => axiosInstance.put(`/PersonalityCard/edit-ownership/${ownershipId}`, data),
  buyCard: (cardId) => axiosInstance.post(`/PersonalityCard/buy/${cardId}`),
  assignCards: (botId, data) => axiosInstance.post(`/PersonalityCard/assign/${botId}`, data),
  deleteCard: (cardId, confirmed = false) => axiosInstance.delete(`/PersonalityCard/delete-card/${cardId}`, { params: { confirmed } }),
  getBotCards: (botId) => axiosInstance.get(`/PersonalityCard/bot-cards/${botId}`),
  getOwnedCards: (actorId, tribeId) => axiosInstance.get('/Card/owned-cards', { params: { actorId, tribeId } }),
  getAssignedCards: (actorId, tribeId) => axiosInstance.get('/Card/assigned-cards', { params: { actorId, tribeId } }),
  getCardOwners: (cardId, page) => axiosInstance.get(`/Card/owners/${cardId}`, { params: { page } }),
  getCardAssignees: (cardId, page) => axiosInstance.get(`/Card/assignees/${cardId}`, { params: { page } }),
  getMarketplaceCards: (page = 1, pageSize = 20) => axiosInstance.get(`/PersonalityCard/marketplace?page=${page}&pageSize=${pageSize}`),
  getMyCards: () => axiosInstance.get('/PersonalityCard/my-cards')
};
