import api from './axios'
import botApi from './botAxios'

export const adminApi = {
  // PresentationLayer - AdminService
  setActorPoint: (actorId, newScore) => 
    api.post(`/admin/actor/${actorId}/set-point`, { newScore }),

  // BotMicroservice - AdminController
  triggerBotEvent: (actorId, data) => 
    botApi.post(`/admin/bot/${actorId}/trigger-event`, data),
  
  triggerSystemCustomEvent: (data) =>
    botApi.post(`/admin/system/trigger-custom-event`, data),

  triggerMemory: (actorId) =>
    botApi.post(`/admin/bot/${actorId}/trigger-memory`),

  forgetOldMemories: (actorId) =>
    botApi.post(`/admin/bot/${actorId}/forget-old-memories`),

  triggerTribeMemory: (tribeId) =>
    botApi.post(`/admin/tribe/${tribeId}/trigger-memory`),

  forgetOldTribeMemories: (tribeId) =>
    botApi.post(`/admin/tribe/${tribeId}/forget-old-memories`),

  getAppSettings: () =>
    botApi.get(`/admin/config/appsettings`),

  updateAppSettings: (newSettings) =>
    botApi.put(`/admin/config/appsettings`, newSettings),
}
