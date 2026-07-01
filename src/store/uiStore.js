import { create } from 'zustand'

/**
 * UI Store — merkezi panel/layout durumu.
 * Sayfa yenilenince sıfırlanması isteniyor (persist yok).
 *
 * centerView: CenterPanel'de ne gösterildiği
 *   - 'feed'          → Ana akış (trending/recent posts)
 *   - 'post'          → Post detay + entry listesi
 *   - 'entry'         → ContentItem bağlamsal görünüm (EntryDto veya PostDto discriminate)
 *   - 'profile'       → ActorProfileView
 *   - 'tribe'         → TribeProfileView
 *   - 'search'        → Arama sonuçları
 *   - 'leaderboard'   → Sıralama tablosu
 *   - 'create-post'   → Yeni konu oluşturma formu
 *   - 'create-tribe'  → Yeni tribe oluşturma formu
 *   - 'create-bot'    → Yeni bot oluşturma formu
 *   - 'init-profile'  → Yeni kayıt sonrası profil tamamlama formu
 *   - 'account-settings' → Hesap ayarları
 *   - 'hierarchy'     → ActorHierarchyTree overlay
 */
const useUIStore = create((set) => ({
  // ─── Center Panel ─────────────────────────────────────────────────────────
  centerView: 'feed',
  centerViewParams: {},   // { postId, actorId, tribeId, query, ... }
  viewHistory: [],        // Max 5 items: [{ view, params }]

  setCenterView: (view, params = {}) =>
    set((state) => {
      // Eğer zaten aynı sayfadaysak (view ve params aynıysa) geçmişe ekleme
      if (state.centerView === view && JSON.stringify(state.centerViewParams) === JSON.stringify(params)) {
        return {}
      }
      
      const newHistoryItem = { view: state.centerView, params: state.centerViewParams }
      const newHistory = [...state.viewHistory, newHistoryItem]
      
      // Maksimum 5 geçmiş tut
      if (newHistory.length > 5) {
        newHistory.shift() // En eskisini sil
      }

      return {
        viewHistory: newHistory,
        centerView: view,
        centerViewParams: params,
      }
    }),

  goBack: () =>
    set((state) => {
      // Geçmiş boşsa Feed'e güvenli dönüş yap
      if (state.viewHistory.length === 0) {
        return { centerView: 'feed', centerViewParams: {} }
      }
      
      const newHistory = [...state.viewHistory]
      const previous = newHistory.pop() // Sonuncuyu al ve listeden çıkar
      
      return {
        viewHistory: newHistory,
        centerView: previous.view,
        centerViewParams: previous.params,
      }
    }),

  // ─── Left Panel ───────────────────────────────────────────────────────────
  activeLeftCacheType: 'recent',
  setActiveLeftCacheType: (type) => set({ activeLeftCacheType: type }),

  isActivitiesExpanded: false,
  toggleActivities: () =>
    set((state) => ({ isActivitiesExpanded: !state.isActivitiesExpanded })),

  // ─── Responsive Drawers ───────────────────────────────────────────────────
  isLeftDrawerOpen: false,
  isRightDrawerOpen: false,
  toggleLeftDrawer: () =>
    set((state) => ({ isLeftDrawerOpen: !state.isLeftDrawerOpen })),
  toggleRightDrawer: () =>
    set((state) => ({ isRightDrawerOpen: !state.isRightDrawerOpen })),
  closeDrawers: () =>
    set({ isLeftDrawerOpen: false, isRightDrawerOpen: false }),

  // ─── My Tribes Dropdown ───────────────────────────────────────────────────
  isMyTribesOpen: false,
  toggleMyTribes: () =>
    set((state) => ({ isMyTribesOpen: !state.isMyTribesOpen })),
  closeMyTribes: () =>
    set({ isMyTribesOpen: false }),

  // ─── Search ───────────────────────────────────────────────────────────────
  searchMode: 'general',  // 'general' | 'posts' | 'actors' | 'tribes'
  setSearchMode: (mode) => set({ searchMode: mode }),
}))

export default useUIStore
