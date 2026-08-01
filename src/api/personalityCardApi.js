import axiosInstance from './axios';

export const personalityCardApi = {
  createCard: (data) => axiosInstance.post('/PersonalityCard/create', data),
  editCard: (cardId, data) => axiosInstance.put(`/PersonalityCard/edit-card/${cardId}`, data),
  editOwnership: (ownershipId, data) => axiosInstance.put(`/PersonalityCard/edit-ownership/${ownershipId}`, data),
  buyCard: (cardId) => axiosInstance.post(`/PersonalityCard/buy/${cardId}`),
  assignCards: (botId, data) => axiosInstance.post(`/PersonalityCard/assign/${botId}`, data),
  deleteCard: (cardId, confirmed = false) => axiosInstance.delete(`/PersonalityCard/delete-card/${cardId}`, { params: { confirmed } }),
  getBotCards: (botId) => axiosInstance.get(`/PersonalityCard/bot-cards/${botId}`),
  getMarketplaceCards: (page = 1, pageSize = 20) => axiosInstance.get(`/PersonalityCard/marketplace?page=${page}&pageSize=${pageSize}`),
  getMyCards: () => axiosInstance.get('/PersonalityCard/my-cards')
};
