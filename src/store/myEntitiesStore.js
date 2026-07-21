import { create } from 'zustand'
import { actorApi } from '../api/actorApi'
import { tribeApi } from '../api/tribeApi'

const useMyEntitiesStore = create((set, get) => ({
  myBots: [],
  myTribes: [],
  myFollowData: { followers: [], following: [] },
  isLoadingBots: false,
  isLoadingTribes: false,
  isLoadingFollowData: false,
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

  fetchMyFollowData: async () => {
    try {
      set({ isLoadingFollowData: true })
      const res = await actorApi.getFollowData()
      const payload = res.data?.data || {}
      const followers = payload.followers || payload.Followers || []
      const following = payload.following || payload.Following || []
      console.log('[myEntitiesStore] fetchMyFollowData response:', payload)
      set({ myFollowData: { followers, following }, isLoadingFollowData: false })
    } catch (error) {
      console.error('Error fetching follow data:', error)
      set({ isLoadingFollowData: false })
    }
  },

  addFollowing: (actorId) => set((state) => ({
    myFollowData: {
      ...state.myFollowData,
      following: [...state.myFollowData.following, actorId]
    }
  })),

  removeFollowing: (actorId) => set((state) => ({
    myFollowData: {
      ...state.myFollowData,
      following: state.myFollowData.following.filter(id => id !== actorId)
    }
  })),

  refreshAll: async () => {
    await Promise.all([get().fetchMyBots(), get().fetchMyTribes(), get().fetchMyFollowData()])
  },

  clear: () => set({ myBots: [], myTribes: [], myFollowData: { followers: [], following: [] }, hasFetchedOnce: false }),
}))

export default useMyEntitiesStore
