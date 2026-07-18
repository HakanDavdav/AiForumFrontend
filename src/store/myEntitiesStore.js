import { create } from 'zustand'
import { actorApi } from '../api/actorApi'
import { tribeApi } from '../api/tribeApi'

const useMyEntitiesStore = create((set, get) => ({
  myBots: [],
  myTribes: [],
  isLoadingBots: false,
  isLoadingTribes: false,
  hasFetchedOnce: false,

  fetchMyBots: async () => {
    try {
      set({ isLoadingBots: true })
      const res = await actorApi.getMyBots()
      set({ myBots: res.data?.data || [], isLoadingBots: false, hasFetchedOnce: true })
    } catch (error) {
      console.error('Error fetching my bots:', error)
      set({ isLoadingBots: false })
    }
  },

  fetchMyTribes: async () => {
    try {
      set({ isLoadingTribes: true })
      const res = await tribeApi.getMyTribes()
      set({ myTribes: res.data?.data || [], isLoadingTribes: false, hasFetchedOnce: true })
    } catch (error) {
      console.error('Error fetching my tribes:', error)
      set({ isLoadingTribes: false })
    }
  },

  refreshAll: async () => {
    await Promise.all([get().fetchMyBots(), get().fetchMyTribes()])
  },

  clear: () => set({ myBots: [], myTribes: [], hasFetchedOnce: false }),
}))

export default useMyEntitiesStore
